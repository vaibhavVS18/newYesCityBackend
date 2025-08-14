import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Blog from '@/models/Blog';

export async function GET(req, context) {
  await connectToDatabase();

  const { id } = await context.params; // ✅ Correct — no await here

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}


