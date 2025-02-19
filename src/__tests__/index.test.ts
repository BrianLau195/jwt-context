import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtContext } from "../index";

describe("jwtContext middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;
  const jwtSecret = "test-secret";

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {};
    nextFunction = jest.fn();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initialization", () => {
    test("should throw error when secret is empty", () => {
      expect(() => jwtContext({ secret: "" })).toThrow(
        "JWT secret cannot be empty",
      );
    });

    test("should accept additional JWT verify options", () => {
      const token = jwt.sign({ data: "test" }, jwtSecret, {
        audience: "test-audience",
      });

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = jwtContext({
        secret: jwtSecret,
        audience: "test-audience",
      });

      middleware(mockReq as Request, mockRes as Response, nextFunction);
      expect(mockReq.jwtContext).toBeTruthy();
    });

    test("should reject token with wrong audience when audience is specified", () => {
      const token = jwt.sign({ data: "test" }, jwtSecret, {
        audience: "wrong-audience",
      });

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = jwtContext({
        secret: jwtSecret,
        audience: "test-audience",
      });

      middleware(mockReq as Request, mockRes as Response, nextFunction);
      expect(mockReq.jwtContext).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("JWT validation failed: jwt audience invalid"),
      );
    });
  });

  describe("Token Extraction", () => {
    test("should set jwtContext to null when no authorization header is present", () => {
      const middleware = jwtContext({ secret: jwtSecret });
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.jwtContext).toBeNull();
      expect(nextFunction).toHaveBeenCalled();
    });

    test("should set jwtContext to null when authorization header does not start with Bearer", () => {
      mockReq.headers = {
        authorization: "Basic some-token",
      };

      const middleware = jwtContext({ secret: jwtSecret });
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.jwtContext).toBeNull();
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe("Token Validation", () => {
    test("should set jwtContext to decoded token when valid JWT is provided", () => {
      const payload = { userId: "123", role: "admin" };
      const token = jwt.sign(payload, jwtSecret);

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = jwtContext({ secret: jwtSecret });
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.jwtContext).toMatchObject(payload);
      expect(nextFunction).toHaveBeenCalled();
    });

    test("should set jwtContext to null when invalid JWT is provided", () => {
      mockReq.headers = {
        authorization: "Bearer invalid-token",
      };

      const middleware = jwtContext({ secret: jwtSecret });
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.jwtContext).toBeNull();
      expect(nextFunction).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("JWT validation failed:"),
      );
    });

    test("should set jwtContext to null when JWT is signed with different secret", () => {
      const token = jwt.sign({ userId: "123" }, "different-secret");

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = jwtContext({ secret: jwtSecret });
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.jwtContext).toBeNull();
      expect(nextFunction).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("JWT validation failed: invalid signature"),
      );
    });

    test("should properly handle standard JWT claims", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        sub: "user123",
        iat: now,
        exp: now + 3600,
      };
      const token = jwt.sign(payload, jwtSecret);

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = jwtContext({ secret: jwtSecret });
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.jwtContext).toMatchObject({
        sub: "user123",
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle TokenExpiredError", () => {
      const token = jwt.sign({ data: "test" }, jwtSecret, { expiresIn: "0s" });

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = jwtContext({ secret: jwtSecret });
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.jwtContext).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("JWT validation failed: jwt expired"),
      );
    });

    test("should handle NotBeforeError", () => {
      const token = jwt.sign({ data: "test" }, jwtSecret, { notBefore: "1h" });

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = jwtContext({ secret: jwtSecret });
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.jwtContext).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("JWT validation failed: jwt not active"),
      );
    });

    test("should handle unknown errors", () => {
      jest.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error("Unknown error");
      });

      mockReq.headers = {
        authorization: `Bearer some-token`,
      };

      const middleware = jwtContext({ secret: jwtSecret });
      middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.jwtContext).toBeNull();
      expect(console.warn).toHaveBeenCalledWith("Unknown JWT error occurred");
    });
  });
});
