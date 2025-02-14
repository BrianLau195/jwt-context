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
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should set jwtContext to null when no authorization header is present", () => {
    const middleware = jwtContext(jwtSecret);
    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockReq.jwtContext).toBeNull();
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should set jwtContext to null when authorization header does not start with Bearer", () => {
    mockReq.headers = {
      authorization: "Basic some-token",
    };

    const middleware = jwtContext(jwtSecret);
    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockReq.jwtContext).toBeNull();
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should set jwtContext to decoded token when valid JWT is provided", () => {
    const payload = { userId: "123", role: "admin" };
    const token = jwt.sign(payload, jwtSecret);

    mockReq.headers = {
      authorization: `Bearer ${token}`,
    };

    const middleware = jwtContext(jwtSecret);
    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockReq.jwtContext).toMatchObject(payload);
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should set jwtContext to null when invalid JWT is provided", () => {
    mockReq.headers = {
      authorization: "Bearer invalid-token",
    };

    const middleware = jwtContext(jwtSecret);
    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockReq.jwtContext).toBeNull();
    expect(nextFunction).toHaveBeenCalled();
  });

  it("should set jwtContext to null and log warning when JWT is signed with different secret", () => {
    const token = jwt.sign({ userId: "123" }, "different-secret");

    mockReq.headers = {
      authorization: `Bearer ${token}`,
    };

    const middleware = jwtContext(jwtSecret);
    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockReq.jwtContext).toBeNull();
    expect(nextFunction).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("JWT validation failed: invalid signature")
    );
  });
});
