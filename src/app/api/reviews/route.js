import { connectToDatabase } from '@/lib/db';
import Review from '@/models/Review';

import Accommodation from '@/models/CityRoutes/Accommodation';
import Activity from '@/models/CityRoutes/Activity';
import CityInfo from '@/models/CityRoutes/CityInfo';
import Connectivity from '@/models/CityRoutes/Connectivity';
import Contribution from '@/models/CityRoutes/Contribution';
import Food from '@/models/CityRoutes/Food';
import HiddenGem from '@/models/CityRoutes/HiddenGem';
import Itinerary from '@/models/CityRoutes/Itinerary';
import Misc from '@/models/CityRoutes/Misc';
import NearbySpot from '@/models/CityRoutes/NearbySpot';
import Place from '@/models/CityRoutes/Place';
import Shop from '@/models/CityRoutes/Shop';
import Transport from '@/models/CityRoutes/Transport';

import { withAuth } from '@/middleware/auth';

const MODELS = {
  Accommodation,
  Activity,
  CityInfo,
  Connectivity,
  Contribution,
  Food,
  HiddenGem,
  Itinerary,
  Misc,
  NearbySpot,
  Place,
  Shop,
  Transport,
};

export async function POST(req) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { rating, content, createdBy, cityName, onModel, parentRef } = body;
    const date = new Date();

    if (!rating || !content || !createdBy || !cityName || !onModel || !parentRef) {
      return new Response(
        JSON.stringify({ message: 'All fields are required.', success: false }),
        { status: 400 }
      );
    }

    const Model = MODELS[onModel];

    if (!Model) {
      return new Response(
        JSON.stringify({ message: 'Invalid model type.', success: false }),
        { status: 400 }
      );
    }

    // ✅ Create the review
    const newReview = await Review.create({
      rating,
      content,
      createdBy,
      date,
      cityName: decodeURIComponent(cityName).toLowerCase(),
      parentRef,
      onModel,
    });

    // ✅ Add the review to the correct document
    await Model.findByIdAndUpdate(
      parentRef,
      { $push: { reviews: newReview._id } },
      { new: true }
    );

    return new Response(
      JSON.stringify({
        message: 'Review added successfully!',
        success: true,
        review: newReview,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving review:', error);
    return new Response(
      JSON.stringify({ message: 'Internal Server Error', success: false }),
      { status: 500 }
    );
  }
}

// export const POST = withAuth(handler);
