import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Shop from '@/models/CityRoutes/Shop';
import { withAuth } from '@/middleware/auth';

// ✅ Premium helper
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

    // ✅ Pagination setup
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5;
    const skip = (page - 1) * limit;

    // ✅ Fetch shops with filters
    const shops = await Shop.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id flagShip reviews shops lat-lon address location-link famous-for price-range open-day open-time phone website image0 image1 image2 premium') // adjust fields if needed
      .skip(skip)
      .limit(limit);

    if (!shops.length) {
      return NextResponse.json({ error: 'No shops found' }, { status: 404 });
    }

    const shopIds = shops.map(shop => shop._id);

    // ✅ Increment views
    await Shop.updateMany(
      { _id: { $in: shopIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Get total for pagination metadata
    const total = await Shop.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: shops,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
