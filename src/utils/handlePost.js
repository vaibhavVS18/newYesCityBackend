// utils/handlePost.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function handlePost(Model, request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const newDocument = new Model(body);
    await newDocument.save();

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
