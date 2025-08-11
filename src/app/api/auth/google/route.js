// /app/api/auth/google/route.js

import { NextResponse } from 'next/server';

export async function GET() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // backend callback

  const oauthURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthURL.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  oauthURL.searchParams.set('redirect_uri', REDIRECT_URI);
  oauthURL.searchParams.set('response_type', 'code');
  oauthURL.searchParams.set('scope', 'openid email profile');
  oauthURL.searchParams.set('access_type', 'offline');
  oauthURL.searchParams.set('prompt', 'consent');

  // Redirect the user to Google login
  return NextResponse.redirect(oauthURL.toString());
}
