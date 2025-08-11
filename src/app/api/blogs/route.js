// import { NextResponse } from 'next/server';
// import { connectToDatabase } from '@/lib/db'; // Utility to connect to MongoDB
// import Blog from '@/models/Blog';

// // Fetch all blogs
// export async function GET() {
//   try {
//     await connectToDatabase();
//     const blogs = await Blog.find();
//     return NextResponse.json(blogs);
//   } catch (error) {
//     console.error('Error fetching blogs:', error);
//     return NextResponse.json({ message: 'Server error' }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Blog from '@/models/Blog';
import { withAuth } from '@/middleware/auth'; // ✅ Import middleware

// Original logic wrapped in a handler
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

// ✅ Protected route using withAuth middleware
export const GET = withAuth(handler);
