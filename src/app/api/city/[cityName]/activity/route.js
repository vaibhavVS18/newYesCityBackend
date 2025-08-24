import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Activity from '@/models/CityRoutes/Activity';
import { withAuth } from '@/middleware/auth';

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

    // ✅ Get query params for pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5; // same as accommodations
    const skip = (page - 1) * limit;

    // ✅ Find activities with pagination
    const activities = await Activity.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName topActivities images premium') // choose fields
      .skip(skip)
      .limit(limit);

    if (!activities.length) {
      return NextResponse.json({ error: 'No activities found' }, { status: 404 });
    }

    // ✅ Update engagement views
    const activityIds = activities.map(act => act._id);
    await Activity.updateMany(
      { _id: { $in: activityIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Get total count for pagination info
    const total = await Activity.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ Export wrapped with auth
export const GET = withAuth(handler);
