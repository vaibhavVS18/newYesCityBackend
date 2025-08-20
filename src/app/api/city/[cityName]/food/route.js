import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Food from '@/models/CityRoutes/Food';
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
    const limit = 5; // keep consistent with other routes
    const skip = (page - 1) * limit;

    // ✅ Find foods with premium filtering + pagination
    const foods = await Food.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id flagShip reviews food-place lat-lon address location-link category veg/non-veg value-for-money service taste hygiene menu-special menu-link open-day open-time phone website description image0 image1 image2 video premium')
      .skip(skip)
      .limit(limit);

    if (!foods.length) {
      return NextResponse.json({ error: 'No food data found' }, { status: 404 });
    }

    const foodIds = foods.map(food => food._id);

    // ✅ Increment views
    await Food.updateMany(
      { _id: { $in: foodIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Get total count for pagination metadata
    const total = await Food.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: foods,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching food data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
