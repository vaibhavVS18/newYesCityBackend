// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Make a custom request type that says:
// “This request has everything NextRequest has plus a .user property.”
interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId?: string;
    email?: string;
    isPremium?: 'FREE' | 'A' | 'B';
    [key: string]: unknown; // optional if you may have more props
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, context: any) => Promise<Response> | Response
) {
  return async (req: AuthenticatedRequest, context: any) => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 403 });
    }

    req.user = decoded as AuthenticatedRequest['user']; // ✅ no `any`

    return handler(req, context);
  };
}
