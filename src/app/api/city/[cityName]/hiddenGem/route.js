import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import HiddenGem from '@/models/CityRoutes/HiddenGem';
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
    const limit = 5; // keep consistent across routes
    const skip = (page - 1) * limit;

    // ✅ Query hidden gems with premium filtering + pagination
    const gems = await HiddenGem.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id hidden-gems category lat-lon address location-link open-day open-time guide-availiblity establish-year fee description essential story image0 image1 image2 video premium')
      .skip(skip)
      .limit(limit);

    if (!gems.length) {
      return NextResponse.json({ error: 'No hidden gems found' }, { status: 404 });
    }

    const gemIds = gems.map(gem => gem._id);

    // ✅ Increment views
    await HiddenGem.updateMany(
      { _id: { $in: gemIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Get total count for pagination metadata
    const total = await HiddenGem.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    return NextResponse.json({
      data: gems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching hidden gems:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
