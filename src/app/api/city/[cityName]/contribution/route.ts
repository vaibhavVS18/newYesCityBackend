import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Contribution from '@/models/CityRoutes/Contribution';
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

    const contributions = await Contribution.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }, // ✅ Premium filter
    });

    if (!contributions.length) {
      return NextResponse.json({ error: 'No contributions found' }, { status: 404 });
    }

    const contributionIds = contributions.map(con => con._id);

    await Contribution.updateMany(
      { _id: { $in: contributionIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Contribution.find({ _id: { $in: contributionIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler); // ✅ Applies JWT and sets req.user
