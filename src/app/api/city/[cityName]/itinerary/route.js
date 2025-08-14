import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Itinerary from '@/models/CityRoutes/Itinerary';
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

    const itineraries = await Itinerary.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }
    });

    if (!itineraries.length) {
      return NextResponse.json({ error: 'No itinerary data found' }, { status: 404 });
    }

    const itineraryIds = itineraries.map(it => it._id);

    await Itinerary.updateMany(
      { _id: { $in: itineraryIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Itinerary.find({ _id: { $in: itineraryIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
