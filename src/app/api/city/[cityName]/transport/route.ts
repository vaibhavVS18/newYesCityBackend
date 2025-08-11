import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Transport from '@/models/CityRoutes/Transport';
import { withAuth } from '@/middleware/auth';

function getAccessiblePremiums(userPremium: string) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

async function handler(req: NextRequest, context: { params: Promise<{ cityName: string }> }) {
  try {
    await connectToDatabase();

    const user = (req as any).user;
    const userPremium = user?.isPremium || 'FREE';

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    const transports = await Transport.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }
    });

    if (!transports.length) {
      return NextResponse.json({ error: 'No transport options found' }, { status: 404 });
    }

    const transportIds = transports.map(item => item._id);

    await Transport.updateMany(
      { _id: { $in: transportIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Transport.find({ _id: { $in: transportIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching transport options:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler); // ✅ Secures with JWT and sets req.user
