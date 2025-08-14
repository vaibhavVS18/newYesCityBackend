import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Misc from '@/models/CityRoutes/Misc';
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

    const miscs = await Misc.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }
    });

    if (!miscs.length) {
      return NextResponse.json({ error: 'No miscellaneous info found' }, { status: 404 });
    }

    const miscIds = miscs.map(item => item._id);

    await Misc.updateMany(
      { _id: { $in: miscIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Misc.find({ _id: { $in: miscIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching miscellaneous data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
