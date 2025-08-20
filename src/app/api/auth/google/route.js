// /app/api/auth/google/route.js
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state');

  if (!state) {
    return NextResponse.json({ message: 'State parameter is required' }, { status: 400 });
  }

  // Parse the state to get phone and referredBy
  let phone, referredBy;
  try {
    const parsedState = JSON.parse(state);
    phone = parsedState.phone;
    referredBy = parsedState.referredBy;
  } catch (error) {
    console.error('Error parsing state:', error);
    return NextResponse.json({ message: 'Invalid state parameter' }, { status: 400 });
  }

  if (!phone) {
    return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // must match Google Console

  const oauthURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthURL.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  oauthURL.searchParams.set('redirect_uri', REDIRECT_URI);
  oauthURL.searchParams.set('response_type', 'code');
  oauthURL.searchParams.set('scope', 'openid email profile');
  oauthURL.searchParams.set('access_type', 'offline');
  oauthURL.searchParams.set('prompt', 'consent');

  // ✅ Pass both phone and referredBy in state parameter (Google will send this back in callback)
  oauthURL.searchParams.set('state', JSON.stringify({ 
    phone, 
    referredBy: referredBy || null 
  }));

  return NextResponse.redirect(oauthURL.toString());
}
