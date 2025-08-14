import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import NearbySpot from '@/models/CityRoutes/NearbySpot';
import { withAuth } from '@/middleware/auth';

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

    const spots = await NearbySpot.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }
    });

    if (!spots.length) {
      return NextResponse.json({ error: 'No nearby spots found' }, { status: 404 });
    }

    const spotIds = spots.map(spot => spot._id);

    await NearbySpot.updateMany(
      { _id: { $in: spotIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await NearbySpot.find({ _id: { $in: spotIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching nearby spots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
