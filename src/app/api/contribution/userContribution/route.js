// app/api/contributions/route.js
import { connectToDatabase } from '@/lib/mongoose';
import Contribution from '@/models/Contribution';
import { withAuth } from '@/lib/withAuth';

export const POST = withAuth(async (req) => {
  try {
    const userId = req.user.userId; // from withAuth
    const body = await req.json();
    const {
      cityName,
      username,
      category,
      title,
      description,
      images, // Array of Cloudinary URLs
      video,  // Single Cloudinary URL
      premium = 'FREE'
    } = body;

    // Validation
    if (!cityName || !title) {
      return new Response(
        JSON.stringify({ error: 'City name and title are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate images array (should be array of URLs)
    if (images && !Array.isArray(images)) {
      return new Response(
        JSON.stringify({ error: 'Images should be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate image URLs are from Cloudinary (optional security check)
    if (images && images.length > 0) {
      const invalidImages = images.filter((url) =>
        typeof url !== 'string' || !url.includes('cloudinary.com')
      );
      if (invalidImages.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid image URLs detected' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate video URL is from Cloudinary (optional security check)
    if (video && (typeof video !== 'string' || !video.includes('cloudinary.com'))) {
      return new Response(
        JSON.stringify({ error: 'Invalid video URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await connectToDatabase();

    // Create new contribution
    const contribution = new Contribution({
      userId,
      cityName,
      username,
      category,
      title,
      description,
      images: images || [],
      video: video || null,
      premium,
      status: 'pending',
      submittedAt: new Date()
    });

    await contribution.save();

    return new Response(
      JSON.stringify({
        message: 'Contribution submitted successfully',
        contribution: {
          id: contribution._id,
          title: contribution.title,
          status: contribution.status,
          submittedAt: contribution.submittedAt,
          images: contribution.images,
          video: contribution.video
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating contribution:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

export const GET = withAuth(async (req) => {
  try {
    const userId = req.user.userId; // from withAuth
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Get user's contributions with pagination
    const contributions = await Contribution
      .find({ userId })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-reviews') // Exclude reviews for performance
      .lean();

    // Get total count for pagination
    const totalContributions = await Contribution.countDocuments({ userId });
    const totalPages = Math.ceil(totalContributions / limit);

    return new Response(
      JSON.stringify({
        contributions,
        pagination: {
          currentPage: page,
          totalPages,
          totalContributions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
