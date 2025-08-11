import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { withAuth } from '@/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';

interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId?: string;
    email?: string;
    isPremium?: 'FREE' | 'A' | 'B';
    [key: string]: any;
  };
}

// POST: Add to wishlist
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  await connectToDatabase();
  const { onModel, parentRef } = await req.json();
  const userId = req.user?.userId;

  if (!userId) {
    return NextResponse.json({ message: 'User ID missing' }, { status: 401 });
  }

  if (!onModel || !parentRef) {
    return NextResponse.json({ message: 'onModel and parentRef required' }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const alreadyExists = user.wishlist.some(
    (item: any) => item.onModel === onModel && item.parentRef.toString() === parentRef
  );

  if (alreadyExists) {
    return NextResponse.json({ message: 'Already in wishlist' }, { status: 400 });
  }

  user.wishlist.push({ onModel, parentRef });
  await user.save();

  return NextResponse.json({ success: true, message: 'Added to wishlist' });
});

// DELETE: Remove from wishlist
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  await connectToDatabase();
  const { onModel, parentRef } = await req.json();
  const userId = req.user?.userId;

  if (!userId) {
    return NextResponse.json({ message: 'User ID missing' }, { status: 401 });
  }

  if (!onModel || !parentRef) {
    return NextResponse.json({ message: 'onModel and parentRef required' }, { status: 400 });
  }

  await User.findByIdAndUpdate(userId, {
    $pull: { wishlist: { onModel, parentRef } },
  });

  return NextResponse.json({ success: true, message: 'Removed from wishlist' });
});

// GET: Fetch wishlist
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

const MODELS: Record<string, any> = {
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

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  await connectToDatabase();
  const userId = req.user?.userId;

  if (!userId) {
    return NextResponse.json({ message: 'User ID missing' }, { status: 401 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  const populated = await Promise.all(
    user.wishlist.map(async (item: any) => {
      try {
        const Model = MODELS[item.onModel];
        if (!Model) return null;
        const data = await Model.findById(item.parentRef).lean();
        return data ? { ...item.toObject(), data } : null;
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json({
    success: true,
    wishlist: populated.filter(Boolean),
  });
});
