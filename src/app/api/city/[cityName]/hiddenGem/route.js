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

// ✅ Core handler (works with/without user)
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

    // ✅ Query hidden gems
    const gems = await HiddenGem.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    })
      .select('_id cityName hiddenGem images premium')
      .skip(skip)
      .limit(limit);

    if (!gems.length) {
      return NextResponse.json({ error: 'No hidden gems found' }, { status: 404 });
    }

    // ✅ Increment views
    const gemIds = gems.map(gem => gem._id);
    await HiddenGem.updateMany(
      { _id: { $in: gemIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    // ✅ Total count
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

// ✅ Export GET with page=1 public, page>1 auth
export async function GET(req, context) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (page === 1) {
    // Public access
    return coreHandler(req, context, null);
  }

  // Auth required for page > 1
  return withAuth(async (reqWithAuth, contextWithAuth) => {
    return coreHandler(reqWithAuth, contextWithAuth, reqWithAuth.user);
  })(req, context);
}
