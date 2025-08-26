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

// ✅ Core handler (shared for both public + auth calls)
async function coreHandler(req, context, user = null) {
  try {
    await connectToDatabase();

    const userPremium = user?.isPremium || 'FREE';
    const { cityName } = context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // ✅ Pagination setup
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5;
    const skip = (page - 1) * limit;

    // ✅ Fetch shops
    const shops = await Shop.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName flagship shops famousFor images premium')
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

    // ✅ Pagination metadata
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

// ✅ GET handler with conditional auth
export async function GET(req, context) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (page === 1) {
    // Public access (FREE tier)
    return coreHandler(req, context, null);
  }

  // Protected access (requires auth)
  return withAuth(async (reqWithAuth, contextWithAuth) => {
    return coreHandler(reqWithAuth, contextWithAuth, reqWithAuth.user);
  })(req, context);
}
