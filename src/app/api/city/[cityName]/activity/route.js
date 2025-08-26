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

// ✅ Core handler (works for both public & auth cases)
async function coreHandler(req, context, user = null) {
  try {
    await connectToDatabase();

    const userPremium = user?.isPremium || 'FREE';
    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // ✅ Get query params for pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5;
    const skip = (page - 1) * limit;

    // ✅ Find activities with pagination
    const activities = await Activity.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName topActivities images premium')
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

    // ✅ Get total count
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

// ✅ Public + Auth entrypoint
export async function GET(req, context) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  // page=1 → no login required
  if (page === 1) {
    return coreHandler(req, context, null);
  }

  // page > 1 → require login
  return withAuth(async (reqWithAuth, contextWithAuth) => {
    return coreHandler(reqWithAuth, contextWithAuth, reqWithAuth.user);
  })(req, context);
}
