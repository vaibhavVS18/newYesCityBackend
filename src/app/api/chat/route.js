import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import City from '@/models/City';
import { getUserFromCookies } from '@/middleware/auth';

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
  const group = searchParams.get('group') || 'Open Chat';
  // pagination params
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const before = searchParams.get('before'); // ISO date string
  const after = searchParams.get('after'); // ISO date string

    if (!city) return NextResponse.json({ success: false, message: 'Missing city' }, { status: 400 });

    const cityDoc = await City.findOne({ cityName: city });
    if (!cityDoc) return NextResponse.json({ success: false, message: 'City not found' }, { status: 404 });

    // Build query with optional pagination
    const query = { city: cityDoc._id, groupName: group };
    if (before) {
      const b = new Date(before);
      if (!isNaN(b.getTime())) query.createdAt = { ...(query.createdAt || {}), $lt: b };
    }
    if (after) {
      const a = new Date(after);
      if (!isNaN(a.getTime())) query.createdAt = { ...(query.createdAt || {}), $gt: a };
    }

    // If fetching 'after' new messages, keep ascending order and return results.
    if (after) {
      const msgs = await ChatMessage.find(query).populate('sender', 'username profileImage').sort({ createdAt: 1 }).limit(limit).lean();
      return NextResponse.json({ success: true, data: msgs });
    }

    // For initial load or 'before' (older messages) we fetch newest-first then reverse so client receives ascending order
    const msgsDesc = await ChatMessage.find(query).populate('sender', 'username profileImage').sort({ createdAt: -1 }).limit(limit).lean();
    const msgs = (msgsDesc || []).reverse();
    return NextResponse.json({ success: true, data: msgs });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
  const body = await request.json();
  const { city, groupName, text, media, emoji } = body;
  if (!city || !groupName) return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });

  const cityDoc = await City.findOne({ cityName: city });
  if (!cityDoc) return NextResponse.json({ success: false, message: 'City not found' }, { status: 404 });

  // get authenticated user from cookies
  const user = await getUserFromCookies();
  if (!user || !user.userId) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });

  const msg = new ChatMessage({ city: cityDoc._id, groupName, sender: user.userId, text, media: media || [], emoji });
    await msg.save();
    const populated = await ChatMessage.findById(msg._id).populate('sender', 'username profileImage');
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
