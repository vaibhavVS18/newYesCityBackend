import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Premium from '@/models/CityRoutes/Premium'; // ✅ Import your Premium model

export async function GET(_request, context) {
  try {
    await connectToDatabase();

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const premiums = await Premium.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') }
    });

    if (!premiums.length) {
      return NextResponse.json({ error: 'No premium listings found' }, { status: 404 });
    }

    const premiumIds = premiums.map(item => item._id);

    await Premium.updateMany(
      { _id: { $in: premiumIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Premium.find({ _id: { $in: premiumIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching premium data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
