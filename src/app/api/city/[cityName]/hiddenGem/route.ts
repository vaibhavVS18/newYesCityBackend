import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import HiddenGem from '@/models/CityRoutes/HiddenGem';
import { withAuth } from '@/middleware/auth';

interface AuthenticatedRequest extends NextRequest {
  user?: {
    isPremium?: 'FREE' | 'A' | 'B';
    [key: string]: unknown;
  };
}

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

    const gems = await HiddenGem.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    if (!gems.length) {
      return NextResponse.json({ error: 'No hidden gems found' }, { status: 404 });
    }

    const gemIds = gems.map((gem) => gem._id);

    await HiddenGem.updateMany(
      { _id: { $in: gemIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await HiddenGem.find({ _id: { $in: gemIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching hidden gems:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
