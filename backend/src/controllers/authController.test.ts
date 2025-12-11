import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from 'shared/src/types/auth';

// Mock database before importing controller
import '../test-utils/mocks/db';
import { mockQuery } from '../test-utils/mocks/db';

// Mock bcrypt
jest.mock('bcryptjs');

// Import controller after mocks are set up
import { signup, login, logout, COOKIE_NAME } from './authController';

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockQuery.mockReset();

    // Setup mock request
    mockRequest = {
      body: {},
      cookies: {},
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('signup', () => {
    const validSignupPayload = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create a new user and return user data with cookie', async () => {
      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.STUDENT,
        created_at: new Date(),
      };

      // Mock bcrypt.hash
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Mock database query
      mockQuery.mockResolvedValue({
        rows: [mockUser],
      });

      mockRequest.body = validSignupPayload;

      await signup(mockRequest as Request, mockResponse as Response);

      // Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);

      // Verify database was called
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['test@example.com', hashedPassword, 'John', 'Doe', UserRole.STUDENT])
      );

      // Verify cookie was set
      // In development, sameSite is "lax", in production it's "strict"
      const expectedSameSite = process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: expectedSameSite,
        })
      );

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: UserRole.STUDENT,
          }),
          expiresIn: '2h',
        })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        // Missing password, firstName, lastName
      };

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields.',
      });
    });

    it('should return 400 if password is too weak', async () => {
      mockRequest.body = {
        ...validSignupPayload,
        password: 'weak', // Too short, no number
      };

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Password must be at least 8 characters and include a number.',
      });
    });

    it('should return 409 if email already exists', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      // Mock database unique violation error
      const error = { code: '23505' };
      mockQuery.mockRejectedValue(error);

      mockRequest.body = validSignupPayload;

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email already exists.',
      });
    });
  });

  describe('login', () => {
    const validLoginPayload = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should authenticate user and return user data with cookie', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.STUDENT,
        created_at: new Date(),
      };

      // Mock database query
      mockQuery.mockResolvedValue({
        rows: [mockUser],
      });

      // Mock bcrypt.compare
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockRequest.body = validLoginPayload;

      await login(mockRequest as Request, mockResponse as Response);

      // Verify database was queried
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com']
      );

      // Verify password was compared
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', hashedPassword);

      // Verify cookie was set
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
        })
      );

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          }),
        })
      );
    });

    it('should return 400 if email or password is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        // Missing password
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email and password required.',
      });
    });

    it('should return 401 if user does not exist', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
      });

      mockRequest.body = validLoginPayload;

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid credentials.',
      });
    });

    it('should return 401 if password is incorrect', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.STUDENT,
        created_at: new Date(),
      };

      mockQuery.mockResolvedValue({
        rows: [mockUser],
      });

      // Mock bcrypt.compare to return false (wrong password)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      mockRequest.body = validLoginPayload;

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid credentials.',
      });
    });
  });

  describe('logout', () => {
    it('should clear auth cookie and return success', async () => {
      await logout(mockRequest as Request, mockResponse as Response);

      // Verify cookie was cleared
      // In development, sameSite is "lax", in production it's "strict"
      const expectedSameSite = process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        COOKIE_NAME,
        expect.objectContaining({
          httpOnly: true,
          sameSite: expectedSameSite,
          path: '/',
        })
      );

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logged out successfully.',
      });
    });
  });
});

