// Lightweight JWT helper for plain-Node processes (used by socket-server)
// This file avoids importing Next.js-only modules so it can run in a standalone Node process.
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
