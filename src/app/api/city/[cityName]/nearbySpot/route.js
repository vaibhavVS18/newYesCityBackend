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

async function handler(req, context) {
  try {
    await connectToDatabase();

    const user = req.user;
    const userPremium = user?.isPremium || 'FREE';

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // ✅ Get query params for pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5; // consistent with other routes
    const skip = (page - 1) * limit;

    // ✅ Find nearby spots with premium filter + pagination
    const spots = await NearbySpot.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName places description images premium') // adjust fields to schema
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

    // ✅ Get total count for pagination metadata
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

export const GET = withAuth(handler);
