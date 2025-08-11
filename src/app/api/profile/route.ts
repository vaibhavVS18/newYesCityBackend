// app/api/profile/route.ts

import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { withAuth } from '@/middleware/auth';

export const PUT = withAuth(async (req: any) => {
  try {
    const body = await req.json();
    const { username } = body;

    // JWT verified user info is attached to req.user by withAuth
    const userId = req.user.userId;

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    user.username = username;
    await user.save();

    return new Response(JSON.stringify({ user, message: 'Username updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating username:', error);
    return new Response(JSON.stringify({ error: 'Failed to update username' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
