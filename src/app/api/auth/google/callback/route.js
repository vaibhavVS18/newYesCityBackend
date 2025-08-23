// /app/api/auth/google/callback/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ message: 'Authorization code missing' }, { status: 400 });
  }

  // Retrieve phone and referredBy from state (sent back by Google)
  let phone, referredBy;
  try {
    const parsedState = JSON.parse(state || '{}');
    phone = parsedState.phone;
    referredBy = parsedState.referredBy;
  } catch (error) {
    console.error('Error parsing state:', error);
    phone = null;
    referredBy = null;
  }

  if (!phone) {
    return NextResponse.json({ message: 'Phone number missing from state' }, { status: 400 });
  }

  try {
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
      console.error('Token exchange failed:', tokenData);
      return NextResponse.json({ message: 'Failed to get access token' }, { status: 400 });
    }

    // Step 2: Fetch user profile
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await userInfoRes.json();

    if (!profile?.email) {
      console.error('Profile fetch failed:', profile);
      return NextResponse.json({ message: 'Failed to fetch user profile' }, { status: 400 });
    }

    await connectToDatabase();

    // Step 3: Find or create user
    let user = await User.findOne({
      $or: [{ email: profile.email }, { googleId: profile.id }],
    });

    if (!user) {
      // Handle referral logic
      let referredByUserId = null;
      if (referredBy) {
        const refUser = await User.findOne({ referralCode: referredBy });
        if (refUser) {
          referredByUserId = refUser._id;

          // Increment referral count and extend premium
          refUser.referralCount += 1;
          const extraDays = 30 * 24 * 60 * 60 * 1000;
          refUser.premiumExpiryDate = refUser.premiumExpiryDate && refUser.premiumExpiryDate > new Date()
            ? new Date(refUser.premiumExpiryDate.getTime() + extraDays)
            : new Date(Date.now() + extraDays);

          await refUser.save();
        }
      }

      // Use phone number as referral code
      const newReferralCode = phone;

      user = await User.create({
        username: profile.name,
        email: profile.email,
        profileImage: profile.picture,
        googleId: profile.id,
        phone,
        isPhoneVerified: true,
        referredBy: referredByUserId,
        referralCode: newReferralCode,
        password: '', // Google users don't need password
      });
    } else {
      // Update existing user if phone or referredBy is missing
      let updateFields = {};
      if (!user.phone) {
        updateFields.phone = phone;
        updateFields.isPhoneVerified = true;
      }

      if (!user.referredBy && referredBy) {
        const refUser = await User.findOne({ referralCode: referredBy });
        if (refUser) {
          updateFields.referredBy = refUser._id;

          // Increment referral count and extend premium
          refUser.referralCount += 1;
          const extraDays = 30 * 24 * 60 * 60 * 1000;
          refUser.premiumExpiryDate = refUser.premiumExpiryDate && refUser.premiumExpiryDate > new Date()
            ? new Date(refUser.premiumExpiryDate.getTime() + extraDays)
            : new Date(Date.now() + extraDays);

          await refUser.save();
        }
      }

      if (Object.keys(updateFields).length > 0) {
        await User.findByIdAndUpdate(user._id, updateFields);
        user = { ...user.toObject(), ...updateFields };
      }
    }

    // Step 4: Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/?token=${token}`;
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.json(
      { message: 'Internal server error during Google authentication' },
      { status: 500 }
    );
  }
}
