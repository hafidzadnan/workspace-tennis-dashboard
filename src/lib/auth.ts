import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';
import { createServerClient } from '@/lib/supabase';

// JWT secret - used for legacy auth, will be removed after full migration
const JWT_SECRET = process.env.JWT_SECRET || 'tennis-club-secret-key-change-in-production';

// Feature flag for Supabase Auth
const USE_SUPABASE_AUTH = process.env.USE_SUPABASE_AUTH === 'true';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'pengurus' | 'anggota';
}

// ============================================
// LEGACY JWT-based Authentication
// ============================================

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

// ============================================
// SUPABASE AUTH
// ============================================

// Get current user from Supabase Auth
async function getSupabaseUser(): Promise<AuthUser | null> {
  const supabase = createServerClient();
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch profile and role from database using profileId
    const profile = await db.profile.findUnique({
      where: { id: user.id },
      include: { role: true }
    });

    if (!profile) {
      // Fallback: user exists in auth but no profile yet
      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
        role: 'anggota',
      };
    }

    const userRole = profile.role?.roleName === 'pengurus' ? 'pengurus' : 'anggota';

    return {
      id: user.id,
      email: user.email!,
      name: profile.name,
      role: userRole,
    };
  } catch (error) {
    console.error('Error getting Supabase user:', error);
    return null;
  }
}

// Get current user from legacy JWT cookie
async function getLegacyUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded;
}

// ============================================
// PUBLIC API
// ============================================

// Get current user - supports both legacy and Supabase Auth
export async function getCurrentUser(): Promise<AuthUser | null> {
  // Try Supabase Auth first if enabled
  if (USE_SUPABASE_AUTH) {
    const supabaseUser = await getSupabaseUser();
    if (supabaseUser) return supabaseUser;
  }

  // Fallback to legacy JWT auth
  return getLegacyUser();
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
