import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Shop from '@/models/CityRoutes/Shop';
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

    const shops = await Shop.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }
    });

    if (!shops.length) {
      return NextResponse.json({ error: 'No shops found' }, { status: 404 });
    }

    const shopIds = shops.map(shop => shop._id);

    await Shop.updateMany(
      { _id: { $in: shopIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Shop.find({ _id: { $in: shopIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
