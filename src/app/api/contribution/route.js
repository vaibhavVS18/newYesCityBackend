// app/api/profile/contributionPoints/route.js

import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { withAuth } from '@/middleware/auth';

// -------------------- INCREMENT User Contribution Points --------------------
export const PATCH = withAuth(async (req) => {
  try {
    const userId = req.user.userId; // from withAuth
    const body = await req.json();
    const { contributionPoints } = body;

    if (contributionPoints === undefined) {
      return new Response(
        JSON.stringify({ error: 'contributionPoints is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await connectToDatabase();

    // Increment contribution points
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { contributionPoints } },
      { new: true, select: 'contributionPoints' } // only fetch contributionPoints
    );

    if (!updatedUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Contribution points updated', contributionPoints: updatedUser.contributionPoints }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating contribution points:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// -------------------- GET User Contribution Points --------------------
export const GET = withAuth(async (req) => {
  try {
    const userId = req.user.userId; // from withAuth

    await connectToDatabase();

    const user = await User.findById(userId).select('contributionPoints');

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ contributionPoints: user.contributionPoints }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching contribution points:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
