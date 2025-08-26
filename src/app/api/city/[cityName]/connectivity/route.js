import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Connectivity from '@/models/CityRoutes/Connectivity';
import { withAuth } from '@/middleware/auth';

// ✅ Premium access logic
function getAccessiblePremiums(userPremium) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

// ✅ Core handler (shared for public & auth)
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

    // ✅ Fetch data
    const connectivityRecords = await Connectivity.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName nearestAirportStationBusStand distance premium')
      .skip(skip)
      .limit(limit);

    if (!connectivityRecords.length) {
      return NextResponse.json({ error: 'No connectivity data found' }, { status: 404 });
    }

    // ✅ Update engagement views
    const connectivityIds = connectivityRecords.map(conn => conn._id);
    await Connectivity.updateMany(
      { _id: { $in: connectivityIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Count total
    const total = await Connectivity.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: connectivityRecords,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching connectivity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ Export: public for page=1, auth required otherwise
export async function GET(req, context) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (page === 1) {
    return coreHandler(req, context, null); // no login needed
  }

  return withAuth(async (reqWithAuth, contextWithAuth) => {
    return coreHandler(reqWithAuth, contextWithAuth, reqWithAuth.user);
  })(req, context);
}
