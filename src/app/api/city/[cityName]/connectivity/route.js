import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Connectivity from '@/models/CityRoutes/Connectivity';
import { withAuth } from '@/middleware/auth'; // ✅ Added middleware

// ✅ Premium access logic
function getAccessiblePremiums(userPremium) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

async function handler(req, context) {
  try {
    await connectToDatabase();

    // ✅ Extract user and premium tier from JWT
    const user = req.user;
    const userPremium = user?.isPremium || 'FREE';

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // ✅ Get query params for pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5; // consistent across routes
    const skip = (page - 1) * limit;

    // ✅ Filter connectivity by city and premium tier with pagination
    const connectivityRecords = await Connectivity.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id reviews nearest-airport/station/bus-stand distance lat-lon location-link major-flights/trains/buses premium')
      .skip(skip)
      .limit(limit);

    if (!connectivityRecords.length) {
      return NextResponse.json({ error: 'No connectivity data found' }, { status: 404 });
    }

    const connectivityIds = connectivityRecords.map(conn => conn._id);

    // ✅ Update engagement views
    await Connectivity.updateMany(
      { _id: { $in: connectivityIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Get total count for pagination metadata
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

// ✅ Protect route with JWT auth
export const GET = withAuth(handler);
