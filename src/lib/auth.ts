import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'tennis-club-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'pengurus' | 'anggota';
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  return sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Clear auth cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

// Get current user from cookie
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded;
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

// Check if user is pengurus (officer)
export async function isPengurus(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'pengurus';
}
