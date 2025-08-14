import { connectToDatabase } from '@/lib/db.js';
import User from '@/models/User.js';
import { withAuth } from '@/middleware/auth.js';
import { NextResponse } from 'next/server';

// ==========================
// POST and DELETE routes
// ==========================
export const POST = withAuth(async (req) => {
  await connectToDatabase();
  const { onModel, parentRef } = await req.json();
  const userId = req.user.id;

  if (!onModel || !parentRef) {
    return NextResponse.json({ message: 'onModel and parentRef required' }, { status: 400 });
  }

  const user = await User.findById(userId);

  const alreadyExists = user.wishlist.some(
    (item) => item.onModel === onModel && item.parentRef.toString() === parentRef
  );

  if (alreadyExists) {
    return NextResponse.json({ message: 'Already in wishlist' }, { status: 400 });
  }

  user.wishlist.push({ onModel, parentRef });
  await user.save();

  return NextResponse.json({ success: true, message: 'Added to wishlist' });
});

export const DELETE = withAuth(async (req) => {
  await connectToDatabase();
  const { onModel, parentRef } = await req.json();
  const userId = req.user.id;

  if (!onModel || !parentRef) {
    return NextResponse.json({ message: 'onModel and parentRef required' }, { status: 400 });
  }

  await User.findByIdAndUpdate(userId, {
    $pull: {
      wishlist: { onModel, parentRef },
    },
  });

  return NextResponse.json({ success: true, message: 'Removed from wishlist' });
});

// ==========================
// GET route for wishlist
// ==========================
import Accommodation from '@/models/CityRoutes/Accommodation.js';
import Activity from '@/models/CityRoutes/Activity.js';
import CityInfo from '@/models/CityRoutes/CityInfo.js';
import Connectivity from '@/models/CityRoutes/Connectivity.js';
import Contribution from '@/models/CityRoutes/Contribution.js';
import Food from '@/models/CityRoutes/Food.js';
import HiddenGem from '@/models/CityRoutes/HiddenGem.js';
import Itinerary from '@/models/CityRoutes/Itinerary.js';
import Misc from '@/models/CityRoutes/Misc.js';
import NearbySpot from '@/models/CityRoutes/NearbySpot.js';
import Place from '@/models/CityRoutes/Place.js';
import Shop from '@/models/CityRoutes/Shop.js';
import Transport from '@/models/CityRoutes/Transport.js';

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

export const GET = withAuth(async (req) => {
  await connectToDatabase();
  const userId = req.user.id;

  const user = await User.findById(userId).lean();

  const populated = await Promise.all(
    user.wishlist.map(async (item) => {
      try {
        const Model = MODELS[item.onModel];
        const data = await Model.findById(item.parentRef).lean();
        return data ? { ...item, data } : null;
      } catch (e) {
        return null;
      }
    })
  );

  return NextResponse.json({
    success: true,
    wishlist: populated.filter(Boolean),
  });
});
