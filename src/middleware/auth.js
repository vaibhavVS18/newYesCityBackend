// middleware/auth.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function withAuth(handler) {
  return async (req, context) => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    console.log(decoded);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 403 });
    }

    // Attach decoded payload to req.user
    req.user = decoded;

    // Call the original handler
    return handler(req, context);
  };
}
