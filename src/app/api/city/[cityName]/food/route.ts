import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Food from '@/models/CityRoutes/Food';
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

    const foods = await Food.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }, // ✅ Premium filter
    });

    if (!foods.length) {
      return NextResponse.json({ error: 'No food data found' }, { status: 404 });
    }

    const foodIds = foods.map(food => food._id);

    await Food.updateMany(
      { _id: { $in: foodIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Food.find({ _id: { $in: foodIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching food data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler); // ✅ Auth wrapper to inject user info
