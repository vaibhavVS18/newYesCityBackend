import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Connectivity from '@/models/CityRoutes/Connectivity';
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

    const connectivityRecords = await Connectivity.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums },
    });

    if (!connectivityRecords.length) {
      return NextResponse.json({ error: 'No connectivity data found' }, { status: 404 });
    }

    const connectivityIds = connectivityRecords.map((conn) => conn._id);

    await Connectivity.updateMany(
      { _id: { $in: connectivityIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Connectivity.find({ _id: { $in: connectivityIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching connectivity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
