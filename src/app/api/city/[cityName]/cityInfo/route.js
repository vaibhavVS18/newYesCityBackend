import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import CityInfo from '@/models/CityRoutes/CityInfo';
import { withAuth } from '@/middleware/auth'; // ✅ Auth middleware

// ✅ Premium access helper
function getAccessiblePremiums(userPremium) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

async function handler(req, context) {
  try {
    await connectToDatabase();

    // ✅ Get premium tier from decoded token
    const user = req.user;
    const userPremium = user?.isPremium || 'FREE';

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // ✅ Get query params for pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 5; // same limit as others
    const skip = (page - 1) * limit;

    // ✅ Query with premium filtering + pagination
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

    const cityInfoIds = cityInfos.map(info => info._id);

    // ✅ Update views
    await CityInfo.updateMany(
      { _id: { $in: cityInfoIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Get total count for pagination info
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

// ✅ Export with auth
export const GET = withAuth(handler);
