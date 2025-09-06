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
    const user = await User.findById(userId);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const storedMonth = user.pointsMonth?.getMonth();
    const storedYear = user.pointsMonth?.getFullYear();

    // Reset if new month
    if (storedMonth !== currentMonth || storedYear !== currentYear) {
      user.monthlyPoints = 0;
      user.pointsMonth = now;
    }

    // Enforce monthly cap of 90
    if (user.monthlyPoints + contributionPoints > 90) {
      return new Response(
        JSON.stringify({ error: 'Monthly limit of 90 contribution points reached' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Apply increment
    user.monthlyPoints += contributionPoints;
    user.contributionPoints += contributionPoints;
    await user.save();

    return new Response(
      JSON.stringify({
        message: 'Contribution points updated',
        contributionPoints: user.contributionPoints,
        monthlyPoints: user.monthlyPoints,
      }),
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

