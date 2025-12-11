import jwt from "jsonwebtoken";
import { Response } from "express";
import { authenticateToken, requireRole, AuthRequest } from "./auth";
import { COOKIE_NAME } from "../controllers/authController";
import { UserRole } from "shared/src/types/auth";

describe("Auth Middleware", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("authenticateToken", () => {
    it("should call next() if valid token in cookie", () => {
      const userId = "123";
      const role = UserRole.TEACHER;
      const token = jwt.sign({ userId, role }, JWT_SECRET);

      mockRequest.cookies = {
        [COOKIE_NAME]: token,
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.userId).toBe(userId);
      expect(mockRequest.userRole).toBe(role);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return 401 if no token in cookie", () => {
      mockRequest.cookies = {};

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access token required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if token is invalid", () => {
      mockRequest.cookies = {
        [COOKIE_NAME]: "invalid-token",
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if token is expired", () => {
      const expiredToken = jwt.sign(
        { userId: "123", role: UserRole.STUDENT },
        JWT_SECRET,
        { expiresIn: "-1h" } // Expired token
      );

      mockRequest.cookies = {
        [COOKIE_NAME]: expiredToken,
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should call next() if user has required role", () => {
      mockRequest.userRole = UserRole.TEACHER;
      const middleware = requireRole([UserRole.TEACHER]);

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return 403 if user does not have required role", () => {
      mockRequest.userRole = UserRole.STUDENT;
      const middleware = requireRole([UserRole.TEACHER]);

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Insufficient permissions",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if user role is undefined", () => {
      mockRequest.userRole = undefined;
      const middleware = requireRole([UserRole.TEACHER]);

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
