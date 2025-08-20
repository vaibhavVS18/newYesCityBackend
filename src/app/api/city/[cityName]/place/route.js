import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Place from '@/models/CityRoutes/Place';
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

    // ✅ Pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5; // consistent with other routes
    const skip = (page - 1) * limit;

    // ✅ Fetch places
    const places = await Place.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id reviews places category lat-lon address location-link open-day open-time establish-year fee description essential story image0 image1 image2 video premium') // adjust fields to your schema
      .skip(skip)
      .limit(limit);

    if (!places.length) {
      return NextResponse.json({ error: 'No places found' }, { status: 404 });
    }

    const placeIds = places.map(place => place._id);

    // ✅ Increment views
    await Place.updateMany(
      { _id: { $in: placeIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Get total count for pagination metadata
    const total = await Place.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: places,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching places:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
