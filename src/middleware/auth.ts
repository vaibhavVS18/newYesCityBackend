import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface JWTPayload {
  userId: string;
  email: string;
  isPremium: 'FREE' | 'A' | 'B';
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload;
  } catch {
    return null;
  }
}

export function withAuth<Context extends { params?: Record<string, string | string[]> }>(
  handler: (req: AuthenticatedRequest, context: Context) => Promise<Response> | Response
) {
  return async (req: AuthenticatedRequest, context: Context) => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 403 });
    }

    req.user = decoded;
    return handler(req, context);
  };
}
