import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Itinerary from '@/models/CityRoutes/Itinerary';
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
    const limit = 5; // keep consistent across all routes
    const skip = (page - 1) * limit;

    // ✅ Find itineraries with pagination
    const itineraries = await Itinerary.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName day1 day2 day3 premium') // adjust fields to your schema
      .skip(skip)
      .limit(limit);

    if (!itineraries.length) {
      return NextResponse.json({ error: 'No itinerary data found' }, { status: 404 });
    }

    const itineraryIds = itineraries.map(it => it._id);

    // ✅ Increment views
    await Itinerary.updateMany(
      { _id: { $in: itineraryIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Total count for pagination metadata
    const total = await Itinerary.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: itineraries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
