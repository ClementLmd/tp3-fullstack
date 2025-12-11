import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import { query } from '../db/connection';
import { SignupPayload, LoginPayload, AuthResponse, User, UserRole } from 'shared/src/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

/**
 * Generate a signed JWT for the given user. Only non-sensitive fields are included.
 */
function generateToken(user: User): string {
  // Cast secret to `Secret` to satisfy type definitions from jsonwebtoken
  const secret: Secret = JWT_SECRET as unknown as Secret;
  return jwt.sign({ userId: user.id, role: user.role }, secret, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * POST /auth/signup
 * Registers a new user, validates input, hashes password and returns a JWT.
 */
export async function signup(req: Request, res: Response) {
  const payload: SignupPayload = req.body;
  const email = payload.email?.toLowerCase?.();
  const password = payload.password;
  const firstName = payload.firstName;
  const lastName = payload.lastName;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Password strength: at least 8 chars, one number and one letter
  const pwdStrong = /(?=.{8,})(?=.*\d)(?=.*[A-Za-z]).*/;
  if (!pwdStrong.test(password)) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 8 characters and include a number.' });
  }

  // Normalize role
  let role: UserRole = UserRole.STUDENT;
  if (payload.role) {
    const r = String(payload.role).toUpperCase();
    if (r === UserRole.TEACHER) role = UserRole.TEACHER;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const result = await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email, hashedPassword, firstName, lastName, role]
    );

    if (!result.rows.length) {
      return res.status(500).json({ error: 'User creation failed.' });
    }

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role as UserRole,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    const token = generateToken(user);
    const response: AuthResponse = { token, user, expiresIn: JWT_EXPIRES_IN };
    return res.status(201).json(response);
  } catch (err: any) {
    if (err?.code === '23505') {
      // Unique violation: email already exists
      return res.status(409).json({ error: 'Email already exists.' });
    }
    console.error('Signup error', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /auth/login
 * Authenticates user and returns a JWT.
 */
export async function login(req: Request, res: Response) {
  const payload: LoginPayload = req.body;
  const email = payload.email?.toLowerCase?.();
  const password = payload.password;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }

  try {
    const result = await query(
      `SELECT id, email, password, first_name, last_name, role, created_at FROM users WHERE email = $1`,
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const row = result.rows[0];
    const valid = await bcrypt.compare(password, row.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user: User = {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role as UserRole,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    const token = generateToken(user);
    const response: AuthResponse = { token, user, expiresIn: JWT_EXPIRES_IN };
    return res.status(200).json(response);
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /auth/logout
 * Logs out the user. With stateless JWT, this mainly serves for:
 * - API consistency and logging
 * - Future token blacklisting if needed
 * The actual token invalidation happens client-side by removing it from storage.
 */
export async function logout(req: Request, res: Response) {
  try {
    // With stateless JWT, logout is primarily client-side
    // This endpoint exists for API consistency and potential future token blacklisting
    // The token will naturally expire based on its expiration time
    
    // Optional: Extract token for logging purposes
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Log logout event (optional, for analytics/tracking)
    if (token) {
      // In a production system, you might want to:
      // 1. Add token to a blacklist (Redis/database)
      // 2. Log the logout event
      // 3. Invalidate refresh tokens if using refresh token flow
      console.log('User logged out');
    }
    
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
