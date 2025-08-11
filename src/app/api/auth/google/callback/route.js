// /app/api/auth/google/callback/route.js

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ message: 'Authorization code missing' }, { status: 400 });
  }

  // Step 1: Exchange code for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.json({ message: 'Failed to get access token' }, { status: 400 });
  }

  // Step 2: Fetch user profile from Google
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const profile = await userInfoRes.json();

  if (!profile?.email) {
    return NextResponse.json({ message: 'Failed to fetch user profile' }, { status: 400 });
  }

  await connectToDatabase();

  // Step 3: Check if user exists in DB
let user = await User.findOne({ $or: [{ email: profile.email }, { googleId: profile.id }] });

if (!user) {
  // Step 4: Create new user
  user = await User.create({
    username: profile.name,
    email: profile.email,
    profileImage: profile.picture,
    googleId: profile.id, // 👈 save googleId here
    password: '', // no password for Google users
  });
}

  // Step 5: Generate JWT
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
console.log(token);
  // Step 6: Redirect to frontend with token (via query param)
  const redirectUrl = `${process.env.FRONTEND_URL}/auth/google/callback?token=${token}`;

  return NextResponse.redirect(redirectUrl);
}
