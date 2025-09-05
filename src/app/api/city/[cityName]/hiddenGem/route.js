import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import HiddenGem from '@/models/CityRoutes/HiddenGem';
import { withAuth } from '@/middleware/auth';
import { recordCategoryEngagement } from '@/lib/engagement'; // ✅ import utility


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

    // ✅ Total count
    const total = await HiddenGem.countDocuments({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    // ✅ Record engagement (including page=1 if user is logged in)
    if (user) {
      await recordCategoryEngagement(user, formattedCityName, "HiddenGem");
    }    

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




// ✅ Public entrypoint
export async function GET(req, context) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (page === 1) {
    // 🔹 Try auth, but don't fail if unauthenticated
    try {
      return await withAuth(async (reqWithAuth, contextWithAuth) => {
        return coreHandler(reqWithAuth, contextWithAuth, reqWithAuth.user);
      })(req, context);
    } catch {
      // If no auth → still allow public access
      return coreHandler(req, context, null);
    }
  }

  // 🔹 Page > 1 always requires login
  return withAuth(async (reqWithAuth, contextWithAuth) => {
    return coreHandler(reqWithAuth, contextWithAuth, reqWithAuth.user);
  })(req, context);
}