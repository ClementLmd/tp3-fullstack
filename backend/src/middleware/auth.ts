import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { JwtPayload, UserRole } from "shared/src/types/auth";
import { COOKIE_NAME } from "../controllers/authController";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

/**
 * Authenticate token from httpOnly cookie (preferred) or Authorization header (fallback)
 * Priority: Cookie > Authorization header (for backward compatibility during migration)
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Try to get token from httpOnly cookie first (more secure)
  let token = req.cookies?.[COOKIE_NAME];

  // Fallback to Authorization header for backward compatibility
  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1];
  }

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

