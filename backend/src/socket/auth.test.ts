/**
 * Tests for socket authentication middleware
 */

import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { UserRole } from 'shared/src/types/auth';
import { authenticateSocket } from './auth';

describe('Socket Authentication Middleware', () => {
  let mockSocket: Partial<Socket>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key';

    mockSocket = {
      handshake: {
        auth: {},
        headers: {},
        query: {},
      } as any,
    };

    mockNext = jest.fn();
  });

  it('should authenticate with valid token from auth', () => {
    const token = jwt.sign(
      { userId: 'user-123', role: UserRole.TEACHER },
      'test-secret-key'
    );

    mockSocket.handshake!.auth = { token };

    authenticateSocket(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect((mockSocket as any).userId).toBe('user-123');
    expect((mockSocket as any).userRole).toBe(UserRole.TEACHER);
  });

  it('should authenticate with valid token from authorization header', () => {
    const token = jwt.sign(
      { userId: 'user-456', role: UserRole.STUDENT },
      'test-secret-key'
    );

    mockSocket.handshake!.headers = { authorization: `Bearer ${token}` };

    authenticateSocket(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect((mockSocket as any).userId).toBe('user-456');
    expect((mockSocket as any).userRole).toBe(UserRole.STUDENT);
  });

  it('should authenticate with valid token from query params', () => {
    const token = jwt.sign(
      { userId: 'user-789', role: UserRole.TEACHER },
      'test-secret-key'
    );

    mockSocket.handshake!.query = { token };

    authenticateSocket(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect((mockSocket as any).userId).toBe('user-789');
    expect((mockSocket as any).userRole).toBe(UserRole.TEACHER);
  });

  it('should reject if no token is provided', () => {
    authenticateSocket(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication error: No token provided',
      })
    );
    expect((mockSocket as any).userId).toBeUndefined();
  });

  it('should reject if token is invalid', () => {
    mockSocket.handshake!.auth = { token: 'invalid-token' };

    authenticateSocket(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication error: Invalid token',
      })
    );
    expect((mockSocket as any).userId).toBeUndefined();
  });

  it('should reject if token is expired', () => {
    const token = jwt.sign(
      { userId: 'user-123', role: UserRole.TEACHER },
      'test-secret-key',
      { expiresIn: '-1h' } // Expired 1 hour ago
    );

    mockSocket.handshake!.auth = { token };

    authenticateSocket(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication error: Invalid token',
      })
    );
    expect((mockSocket as any).userId).toBeUndefined();
  });

  it('should reject if token has wrong secret', () => {
    const token = jwt.sign(
      { userId: 'user-123', role: UserRole.TEACHER },
      'wrong-secret-key'
    );

    mockSocket.handshake!.auth = { token };

    authenticateSocket(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication error: Invalid token',
      })
    );
    expect((mockSocket as any).userId).toBeUndefined();
  });
});
