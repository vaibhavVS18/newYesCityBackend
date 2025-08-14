import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Activity from '@/models/CityRoutes/Activity';
import { withAuth } from '@/middleware/auth'; // ✅ Include auth middleware

// ✅ Helper to get allowed tiers
function getAccessiblePremiums(userPremium) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

// ✅ Main handler wrapped with auth
async function handler(req, context) {
  try {
    await connectToDatabase();

    // ✅ Extract user from JWT
    const user = req.user;
    const userPremium = user?.isPremium || 'FREE';

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    // ✅ Apply premium-based filter
    const accessiblePremiums = getAccessiblePremiums(userPremium);

    const activities = await Activity.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }
    });

    if (!activities.length) {
      return NextResponse.json({ error: 'No activities found' }, { status: 404 });
    }

    const activityIds = activities.map(act => act._id);

    await Activity.updateMany(
      { _id: { $in: activityIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Activity.find({ _id: { $in: activityIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ Export wrapped with auth
export const GET = withAuth(handler);
