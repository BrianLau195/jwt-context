"use strict";

import { Request, Response, NextFunction } from "express";
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

const jwtContext =
  (jwtSecret: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.jwtContext = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTContext;
      req.jwtContext = decoded;
    } catch (err) {
      req.jwtContext = null;
    }

    next();
  };

export { jwtContext };
