// app/api/auth/signup/route.js

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  const body = await req.json();
  const {
    username,
    email,
    password,
    isPremium,     // optional
    referralCode,  // optional
    referredBy,    // optional
    profileImage,  // optional
  } = body;

  if (!username || !email || !password) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  await connectToDatabase();

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isPremium,
      referralCode,
      referredBy,
      profileImage,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(token);
    return NextResponse.json(
      {
        success: true,
        message: 'User registered and logged in successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isPremium: user.isPremium,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
