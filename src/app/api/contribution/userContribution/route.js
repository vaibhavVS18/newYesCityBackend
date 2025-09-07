// app/api/contribution/userContribution/route.js
import { connectToDatabase } from '@/lib/db';
import Contribution from '@/models/Contribution';
import { withAuth } from '@/middleware/auth';

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
    } = body;

    console.log('POST userContribution called with:', {
      userId,
      cityName,
      title,
      imagesCount: images?.length || 0,
      hasVideo: !!video
    });

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
    if (video && (!video.includes('cloudinary.com') || typeof video !== 'string')) {
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
      status: 'pending',
      submittedAt: new Date()
    });

    await contribution.save();

    console.log('Contribution created successfully:', contribution._id);

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




export const GET = withAuth(async (req, { params }) => {
  try {
    const userId = req.user.userId; // from withAuth
    const { cityName } = params; // 👈 comes from URL param
    const url = new URL(req.url);

    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    console.log("GET userContribution by cityName called:", {
      userId,
      cityName,
      page,
      limit,
      skip,
    });

    if (!cityName) {
      return new Response(
        JSON.stringify({ error: "cityName param is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await connectToDatabase();

    // Find contributions by user + cityName
    const contributions = await Contribution.find({
      userId,
      cityName: decodeURIComponent(cityName),
    })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-reviews")
      .lean();

    const totalContributions = await Contribution.countDocuments({
      userId,
      cityName: decodeURIComponent(cityName),
    });
    const totalPages = Math.ceil(totalContributions / limit);

    return new Response(
      JSON.stringify({
        contributions,
        pagination: {
          currentPage: page,
          totalPages,
          totalContributions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
