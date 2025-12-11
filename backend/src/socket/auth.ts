/**
 * Socket.io authentication middleware
 * Verifies JWT token and attaches user info to socket
 */

import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'shared/src/types/auth';

// Extended socket type with user info
interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
}

/**
 * Extract token from cookie string
 */
function extractTokenFromCookie(cookieString: string | undefined, cookieName: string): string | null {
  if (!cookieString) return null;
  
  const cookies = cookieString.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === cookieName) {
      return value;
    }
  }
  return null;
}

/**
 * Middleware to authenticate socket connections
 * Extracts JWT from auth token, cookie, or query params and verifies it
 */
export function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  try {
    const authSocket = socket as AuthenticatedSocket;
    
    // Try to get token from multiple sources
    let token = 
      socket.handshake.auth?.token || 
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token as string;
    
    // If no token yet, try to extract from cookie
    if (!token) {
      const cookieHeader = socket.handshake.headers?.cookie;
      token = extractTokenFromCookie(cookieHeader, 'auth_token') || null;
    }

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return next(new Error('Authentication error: Server configuration error'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Attach user info to socket
    authSocket.userId = decoded.userId;
    authSocket.userRole = decoded.role;

    next();
  } catch (err) {
    console.error('Socket authentication error:', err);
    next(new Error('Authentication error: Invalid token'));
  }
}
