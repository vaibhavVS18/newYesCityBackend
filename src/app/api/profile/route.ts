import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { withAuth } from '@/middleware/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId?: string;
    email?: string;
    isPremium?: 'FREE' | 'A' | 'B';
    [key: string]: unknown; // removed 'any'
  };
}

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    await connectToDatabase();

    const { username } = await req.json();
    const userId = req.user?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID missing' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.username = username;
    await user.save();

    return NextResponse.json(
      { user, message: 'Username updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating username:', error);
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }
});
