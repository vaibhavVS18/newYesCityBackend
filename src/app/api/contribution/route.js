import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Contribution from '@/models/Contribution';
import User from '@/models/User';
import { withAuth } from '@/middleware/auth';

// -------------------- GET Contributions --------------------
async function getHandler(req, context) {
  try {
    await connectToDatabase();

    const { cityName } = await context.params;
    const formattedCityName = decodeURIComponent(cityName).toLowerCase();

    const contributions = await Contribution.find({
      cityName: { $regex: new RegExp(`^${formattedCityName}$`, 'i') },
    });

    if (!contributions.length) {
      return NextResponse.json({ error: 'No contributions found' }, { status: 404 });
    }

    const contributionIds = contributions.map(con => con._id);

    await Contribution.updateMany(
      { _id: { $in: contributionIds } },
      { $inc: { 'engagement.views': 1 } }
    );

    const updated = await Contribution.find({ _id: { $in: contributionIds } });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// -------------------- POST Contribution --------------------
async function postHandler(req) {
  try {
    await connectToDatabase();

    const user = req.user; // from withAuth middleware
    const { cityName, category, title, description, images, video } = await req.json();

    if (!category || !title) {
      return NextResponse.json({ error: 'Category and title are required' }, { status: 400 });
    }

    const contribution = new Contribution({
      userId: user._id,
      username: user.username,
      cityName,
      category,
      title,
      description,
      images: images || [],
      video: video || '',
    });

    await contribution.save();

    // Award points to user
    const pointsToAdd = 10; // Example: 10 points per contribution
    await User.findByIdAndUpdate(user._id, { $inc: { points: pointsToAdd } });

    return NextResponse.json({
      message: 'Contribution submitted successfully',
      contribution,
      pointsAwarded: pointsToAdd,
    });
  } catch (error) {
    console.error('Error submitting contribution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
