import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Place from '@/models/CityRoutes/Place';
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

    const places = await Place.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }
    });

    if (!places.length) {
      return NextResponse.json({ error: 'No places found' }, { status: 404 });
    }

    const placeIds = places.map(place => place._id);

    await Place.updateMany(
      { _id: { $in: placeIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Place.find({ _id: { $in: placeIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching places:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
