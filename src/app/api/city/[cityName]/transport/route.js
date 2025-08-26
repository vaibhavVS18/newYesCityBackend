import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Transport from '@/models/CityRoutes/Transport';
import { withAuth } from '@/middleware/auth';

// ✅ Premium helper
function getAccessiblePremiums(userPremium) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

// ✅ Core handler (works for both public + auth)
async function coreHandler(req, context, user = null) {
  try {
    await connectToDatabase();

    const userPremium = user?.isPremium || 'FREE';
    const { cityName } = context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // ✅ Pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5;
    const skip = (page - 1) * limit;

    // ✅ Fetch transports
    const transports = await Transport.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName from to premium')
      .skip(skip)
      .limit(limit);

    if (!transports.length) {
      return NextResponse.json({ error: 'No transport options found' }, { status: 404 });
    }

    const transportIds = transports.map(item => item._id);

    // ✅ Increment views
    await Transport.updateMany(
      { _id: { $in: transportIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Count total for pagination
    const total = await Transport.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: transports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transport options:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ Public for page=1, auth required for page>1
export async function GET(req, context) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (page === 1) {
    // Public access
    return coreHandler(req, context, null);
  }

  // Auth required for other pages
  return withAuth(async (reqWithAuth, contextWithAuth) => {
    return coreHandler(reqWithAuth, contextWithAuth, reqWithAuth.user);
  })(req, context);
}
