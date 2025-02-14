# JWT Context Middleware

A lightweight Express middleware for handling JWT authentication context.

[![NPM Version][npm-version-image]][npm-url]

## Installation

```bash
npm install jwt-context
```

## Usage

```typescript
import express from "express";
import { jwtContext } from "jwt-context";

const app = express();

// Initialize the middleware with your JWT secret
app.use(jwtContext("your-jwt-secret"));

// The JWT payload is now available in req.jwtContext
app.get("/protected", (req, res) => {
  if (!req.jwtContext) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Access the JWT payload
  const { userId, role } = req.jwtContext;
  res.json({ userId, role });
});
```

## Features

- Automatically extracts and verifies JWT from Authorization header
- Adds decoded JWT payload to `req.jwtContext`
- Sets `req.jwtContext` to `null` for invalid or missing tokens
- TypeScript support with built-in type definitions
- Zero dependencies (except for `jsonwebtoken` and `express`)

## API

### jwtContext(jwtSecret: string)

Creates the middleware function with the provided JWT secret.

#### Parameters

- `jwtSecret` (string): The secret key used to verify JWT tokens

#### Behavior

- Looks for Bearer token in Authorization header
- If token is valid, sets `req.jwtContext` to the decoded JWT payload
- If token is missing or invalid, sets `req.jwtContext` to `null`
- Always calls `next()` to continue request processing

## TypeScript Support

The middleware includes TypeScript definitions and extends the Express Request type:

```typescript
declare global {
  namespace Express {
    interface Request {
      jwtContext: JWTContext | null;
    }
  }
}
```

## License

MIT

[npm-url]: https://npmjs.org/package/jwt-context
[npm-version-image]: https://badgen.net/npm/v/express