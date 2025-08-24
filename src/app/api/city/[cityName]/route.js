import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import City from '@/models/City';
import CityInfo from '@/models/CityRoutes/CityInfo';

export async function GET(request, context) {
  try {
    await connectToDatabase();

    const { cityName } = await context.params;

    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    // Increment city views and get city
    const updatedCity = await City.findOneAndUpdate(
      { "cityName": new RegExp(`^${formattedCityName}$`, 'i') },
      { $inc: { 'engagement.views': 1 } },
      { new: true }
    ).select("cityName content cover-image");;

    if (!updatedCity) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // ✅ Fetch corresponding city info
const cityInfo = await CityInfo.findOne({ cityId: updatedCity._id })
  .select('_id cityName stateOrUT alternateNames coverImage premium'); 
  // select only the fields you want


    return NextResponse.json({
      city: updatedCity,
      cityInfo: cityInfo || null // null if not found
    });

  } catch (error) {
    console.error('Error fetching city:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
