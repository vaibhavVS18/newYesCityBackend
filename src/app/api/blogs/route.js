import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Blog from '@/models/Blog';
import { withAuth } from '@/middleware/auth';


async function handler() {
  try {
    await connectToDatabase();
    const blogs = await Blog.find();
    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);