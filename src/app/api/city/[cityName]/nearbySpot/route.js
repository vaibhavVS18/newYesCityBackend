import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import NearbySpot from '@/models/CityRoutes/NearbySpot';
import { withAuth } from '@/middleware/auth';

// ✅ Premium access helper
function getAccessiblePremiums(userPremium) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

// ✅ Core logic (shared between public + protected)
async function coreHandler(req, context, user = null) {
  try {
    await connectToDatabase();

    const userPremium = user?.isPremium || 'FREE';

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // ✅ Pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5;
    const skip = (page - 1) * limit;

    // ✅ Fetch nearby spots
    const spots = await NearbySpot.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName places description images premium')
      .skip(skip)
      .limit(limit);

    if (!spots.length) {
      return NextResponse.json({ error: 'No nearby spots found' }, { status: 404 });
    }

    const spotIds = spots.map(spot => spot._id);

    // ✅ Increment views
    await NearbySpot.updateMany(
      { _id: { $in: spotIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Total count
    const total = await NearbySpot.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: spots,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching nearby spots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ GET route: page=1 → public, page>1 → requires login
export async function GET(req, context) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (page === 1) {
    // Public access
    return coreHandler(req, context, null);
  }

  // Protected access
  return withAuth(async (reqWithAuth, contextWithAuth) => {
    return coreHandler(reqWithAuth, contextWithAuth, reqWithAuth.user);
  })(req, context);
}
