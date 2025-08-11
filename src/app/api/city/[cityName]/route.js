import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import City from '@/models/City';

export async function GET(request, context) {
  try {
    await connectToDatabase();

    const { cityName } = await context.params; // ✅ await required here

    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const updatedCity = await City.findOneAndUpdate(
      { "city-name": new RegExp(`^${formattedCityName}$`, 'i') },
      { $inc: { 'engagement.views': 1 } },
      { new: true }
    );

    if (!updatedCity) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error('Error fetching city:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
