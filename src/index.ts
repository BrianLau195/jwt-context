"use strict";

import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from "jsonwebtoken";
import jwt from "jsonwebtoken";

interface JWTContext {
  readonly [key: string]: unknown;
  iat?: number;
  exp?: number;
  sub?: string;
}

declare global {
  namespace Express {
    interface Request {
      jwtContext: JWTContext | null;
    }
  }
}

class JWTValidator {
  private readonly jwtSecret: string;
  private readonly options: jwt.VerifyOptions;

  constructor(jwtSecret: string, options: jwt.VerifyOptions = {}) {
    if (!jwtSecret) {
      throw new Error("JWT secret cannot be empty");
    }
    this.jwtSecret = jwtSecret;
    this.options = options;
  }

  private validateToken(token: string): JWTContext | null {
    try {
      return jwt.verify(token, this.jwtSecret, this.options) as JWTContext;
    } catch (err) {
      this.handleError(err);
      return null;
    }
  }

  private extractToken(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.split(" ")[1];
  }

  private handleError(err: unknown): void {
    if (err instanceof Error) {
      if (
        err instanceof JsonWebTokenError ||
        err instanceof TokenExpiredError ||
        err instanceof NotBeforeError
      ) {
        console.warn(`JWT validation failed: ${err.message}`);
      } else {
        console.warn("Unknown JWT error occurred");
      }
    }
  }

  public middleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const token = this.extractToken(req.headers.authorization);
      req.jwtContext = token ? this.validateToken(token) : null;
      next();
    };
  }
}

export interface JWTValidatorOptions extends jwt.VerifyOptions {
  secret: string;
}

export function jwtContext(options: JWTValidatorOptions): RequestHandler {
  const validator = new JWTValidator(options.secret, options);
  return validator.middleware();
}
