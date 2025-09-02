// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  const body = await req.json();
  const { emailOrUsername, password } = body;

  if (!emailOrUsername || !password) {
    return NextResponse.json(
      { message: 'Email/Username and password are required' },
      { status: 400 }
    );
  }

  await connectToDatabase();

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        isPremium: user.isPremium,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Create response first
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isPremium: user.isPremium,
        },
      },
      { status: 200 }
    );

    // ✅ Attach cookie on the response
    response.cookies.set({
      name: 'token',
      value: token,
  secure: process.env.NODE_ENV === "production", // only secure in prod
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
