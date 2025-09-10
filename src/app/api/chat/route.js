import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import City from '@/models/City';
import User from '@/models/User';

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const group = searchParams.get('group') || 'Open Chat';

    if (!city) return NextResponse.json({ success: false, message: 'Missing city' }, { status: 400 });

    const cityDoc = await City.findOne({ cityName: city });
    if (!cityDoc) return NextResponse.json({ success: false, message: 'City not found' }, { status: 404 });

    const msgs = await ChatMessage.find({ city: cityDoc._id, groupName: group }).populate('sender', 'username profileImage').sort({ createdAt: 1 }).lean();
    return NextResponse.json({ success: true, data: msgs });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { city, groupName, senderId, text, media, emoji } = body;
    if (!city || !groupName || !senderId) return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });

    const cityDoc = await City.findOne({ cityName: city });
    if (!cityDoc) return NextResponse.json({ success: false, message: 'City not found' }, { status: 404 });

    const user = await User.findById(senderId);
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const msg = new ChatMessage({ city: cityDoc._id, groupName, sender: user._id, text, media: media || [], emoji });
    await msg.save();
    const populated = await ChatMessage.findById(msg._id).populate('sender', 'username profileImage');
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
