// Shared authentication types used across frontend and backend
// Place all auth-related interfaces here to ensure consistent typing
// between Next.js frontend and Express backend.

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface User {
  // Unique identifier for the user (database primary key)
  id: string;
  // Email is the primary login identifier
  email: string;
  // First and last name stored separately in DB
  firstName?: string;
  lastName?: string;
  // Role for authorization checks
  role: UserRole;
  // ISO timestamp of account creation
  createdAt?: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  // Optional role during signup (defaults to STUDENT on backend)
  role?: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  // Token is now stored in httpOnly cookie, not returned in response body
  // Keeping token field optional for backward compatibility during migration
  token?: string;
  user: User;
  // Optional human-readable expiry (e.g. '2h')
  expiresIn?: string;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
