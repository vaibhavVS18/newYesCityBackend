import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/db';

export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();
    // Expecting { files: [ { dataUrl: 'data:image/..;base64,...' }, ... ] }
    const files = body.files || [];
    const uploaded = [];
    for (const f of files) {
      if (!f.dataUrl) continue;
      const res = await cloudinary.uploader.upload(f.dataUrl, { resource_type: 'auto', folder: 'yescity/chat' });
      uploaded.push(res.secure_url);
    }
    return NextResponse.json({ success: true, data: uploaded });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
