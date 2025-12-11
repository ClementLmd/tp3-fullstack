import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { JwtPayload, UserRole } from "shared/src/types/auth";
import { COOKIE_NAME } from "../controllers/authController";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

/**
 * Authenticate token from httpOnly cookie
 * 
 * Security: Token is stored in httpOnly cookie (set by login/signup endpoints)
 * This prevents XSS attacks as JavaScript cannot access httpOnly cookies.
 * 
 * Note: Authorization header fallback removed - all auth now uses cookies only.
 * If you need to support API clients without cookies, consider implementing
 * a separate API key authentication mechanism.
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Get token from httpOnly cookie (only secure method)
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    // Cast secret to `Secret` to satisfy type definitions
    const secret: Secret = (process.env.JWT_SECRET ||
      "default-secret") as unknown as Secret;
    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.userId = decoded.userId;
    req.userRole = decoded.role as UserRole;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

