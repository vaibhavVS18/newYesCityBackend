// app/api/auth/signup/route.js

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { extendUserPremium } from "@/lib/extendPremium";


export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const { username, email, password, phone, referredBy, profileImage } = body;

  if (!username || !email || !password || !phone) {
    return NextResponse.json(
      { message: 'All fields are required (including phone)' },
      { status: 400 }
    );
  }

  await connectToDatabase();

  try {
    // Check duplicates
    if (await User.findOne({ email })) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    if (await User.findOne({ phone })) {
      return NextResponse.json({ message: 'Phone number already in use' }, { status: 409 });
    }

    let referredByUserId = null;

    if (referredBy) {
      const refUser = await User.findOne({ referralCode: referredBy });
      if (refUser) {
        referredByUserId = refUser._id;

        // Increment referral count
        refUser.referralCount += 1;
        await refUser.save();

      // inside signup route after incrementing referral count
      try {
        await extendUserPremium(refUser._id); // direct call
      } catch (err) {
        console.error("Failed to extend referrer premium:", err);
      }

      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      referralCode: phone, // use phone as referral code
      referredBy: referredByUserId,
      profileImage,
      isPremium: 'FREE', // default value
    });

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'User registered and logged in successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          isPremium: user.isPremium
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
