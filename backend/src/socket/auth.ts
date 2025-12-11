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
 * Middleware to authenticate socket connections
 * Extracts JWT from auth token or cookie and verifies it
 */
export function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  try {
    const authSocket = socket as AuthenticatedSocket;
    
    // Try to get token from handshake auth or query params
    const token = 
      socket.handshake.auth?.token || 
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token as string;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    
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
