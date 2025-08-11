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

export function withAuth(handler: Function) {
  return async (req: NextRequest, context: any) => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 403 });
    }

    // ✅ Just attach the decoded token to req as .user
//     decoded → is the payload from your JWT (e.g., { userId, email, isPremium }).
// This line stores that payload on the req object under .user.
    (req as any).user = decoded;

    // ✅ Call the original handler with req and context
    return handler(req, context);
  };
}
