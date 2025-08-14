import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Connectivity from '@/models/CityRoutes/Connectivity';
import { withAuth } from '@/middleware/auth'; // ✅ Added middleware

// ✅ Premium access logic
function getAccessiblePremiums(userPremium) {
  if (userPremium === 'B') return ['FREE', 'A', 'B'];
  if (userPremium === 'A') return ['FREE', 'A'];
  return ['FREE'];
}

async function handler(req, context) {
  try {
    await connectToDatabase();

    // ✅ Extract user and premium tier from JWT
    const user = req.user;
    const userPremium = user?.isPremium || 'FREE';

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // ✅ Filter connectivity by city and premium tier
    const connectivityRecords = await Connectivity.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
      premium: { $in: accessiblePremiums }
    });

    if (!connectivityRecords.length) {
      return NextResponse.json({ error: 'No connectivity data found' }, { status: 404 });
    }

    const connectivityIds = connectivityRecords.map(conn => conn._id);

    // ✅ Update engagement views
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

// ✅ Protect route with JWT auth
export const GET = withAuth(handler);
