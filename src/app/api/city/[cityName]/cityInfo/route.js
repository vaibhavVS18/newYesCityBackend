import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import CityInfo from '@/models/CityRoutes/CityInfo';
import { withAuth } from '@/middleware/auth';

// ✅ Premium access helper
function getAccessiblePremiums(userPremium) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

// ✅ Core handler (works for both public & authenticated users)
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

    // ✅ Query with filters
    const cityInfos = await CityInfo.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName stateOrUT alternateNames coverImage premium')
      .skip(skip)
      .limit(limit);

    if (!cityInfos.length) {
      return NextResponse.json({ error: 'No city info found' }, { status: 404 });
    }

    // ✅ Update views
    const cityInfoIds = cityInfos.map(info => info._id);
    await CityInfo.updateMany(
      { _id: { $in: cityInfoIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Total count
    const total = await CityInfo.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: cityInfos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching city info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ Public for page=1, Auth required for page>1
export async function GET(req, context) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (page === 1) {
    return coreHandler(req, context, null); // no auth
  }

  return withAuth(async (reqWithAuth, contextWithAuth) => {
    return coreHandler(reqWithAuth, contextWithAuth, reqWithAuth.user);
  })(req, context);
}
