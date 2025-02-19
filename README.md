# JWT Context Middleware

A lightweight Express middleware for JWT (JSON Web Token) validation and context extraction.

[![NPM Version][npm-version-image]][npm-url]

## Installation

```bash
npm install jwt-context
```

## Features

- Simple JWT validation middleware for Express applications
- Automatically extracts and validates Bearer tokens from Authorization headers
- Adds decoded JWT payload to request object as `req.jwtContext`
- TypeScript support with built-in type definitions
- Configurable JWT verification options

## Usage

```typescript
import express from "express";
import { jwtContext } from "jwt-context";

const app = express();

// Add the middleware to your Express application
app.use(
  jwtContext({
    secret: "your-jwt-secret-key",
    // Optional JWT verify options
    algorithms: ["HS256"],
    issuer: "your-issuer",
  }),
);

// Access JWT context in your routes
app.get("/protected", (req, res) => {
  if (!req.jwtContext) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Access JWT claims
  const userId = req.jwtContext.sub;
  res.json({ userId });
});
```

## TypeScript Support

The middleware extends Express's `Request` interface to include the `jwtContext` property:

```typescript
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
```

## Configuration

The middleware accepts all standard JWT verification options supported by the `jsonwebtoken` library:

```typescript
interface JWTValidatorOptions {
  secret: string;
  algorithms?: string[];
  audience?: string | string[];
  issuer?: string | string[];
  subject?: string;
  clockTolerance?: number;
  maxAge?: string | number;
  // ... other jsonwebtoken VerifyOptions
}
```

## Error Handling

The middleware automatically handles JWT validation errors:

- Invalid tokens
- Expired tokens
- Tokens that are not yet valid
- Malformed tokens

Errors are logged with `console.warn` and the `req.jwtContext` will be set to `null`.

## License

MIT

[npm-url]: https://npmjs.org/package/jwt-context
[npm-version-image]: https://badgen.net/npm/v/jwt-context
