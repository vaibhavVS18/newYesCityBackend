import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Accommodation from '@/models/CityRoutes/Accommodation';
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

    const accommodations = await Accommodation.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }, // ✅ Filter based on premium
    });

    if (!accommodations.length) {
      return NextResponse.json({ error: 'No accommodations found' }, { status: 404 });
    }

    const accommodationIds = accommodations.map(acc => acc._id);

    await Accommodation.updateMany(
      { _id: { $in: accommodationIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Accommodation.find({ _id: { $in: accommodationIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
