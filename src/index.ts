"use strict";

import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from "jsonwebtoken";
import jwt from "jsonwebtoken";

interface JWTContext {
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      jwtContext: JWTContext | null;
    }
  }
}

export function jwtContext(jwtSecret: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.jwtContext = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTContext;
      req.jwtContext = decoded;
    } catch (err: unknown) {
      if (
        err instanceof JsonWebTokenError ||
        err instanceof TokenExpiredError ||
        err instanceof NotBeforeError
      ) {
        console.warn("JWT validation failed:", err.message);
      }
      req.jwtContext = null;
    }

    next();
  };
}
