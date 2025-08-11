import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import CityInfo from '@/models/CityRoutes/CityInfo';
import { withAuth } from '@/middleware/auth';

// ✅ Define a type so req.user is recognized
interface AuthenticatedRequest extends NextRequest {
  user?: {
    isPremium?: 'FREE' | 'A' | 'B';
    [key: string]: unknown;
  };
}

// ✅ Premium access helper
function getAccessiblePremiums(userPremium: string) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

async function handler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ cityName: string }> }
) {
  try {
    await connectToDatabase();

    const userPremium = req.user?.isPremium || 'FREE';

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    const cityInfos = await CityInfo.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    if (!cityInfos.length) {
      return NextResponse.json({ error: 'No city info found' }, { status: 404 });
    }

    const cityInfoIds = cityInfos.map((info) => info._id);

    await CityInfo.updateMany(
      { _id: { $in: cityInfoIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await CityInfo.find({ _id: { $in: cityInfoIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching city info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
