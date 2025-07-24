import { connectToDatabase } from '@/lib/db';
import YesCityReview from '@/models/YesCityReview';


export async function POST(req) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { rating, content, createdBy } = body;
    const date = new Date().toISOString().split('T')[0];

    console.log(body);

    if (!rating || !content || !createdBy) {
      return new Response(JSON.stringify({ message: 'All fields are required.', success: false }), {
        status: 400,
      });
    }

    const newReview = await YesCityReview.create({
      rating,
      content,
      createdBy,
      date,
    });

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
    return new Response(JSON.stringify({ message: 'Internal Server Error', success: false }), {
      status: 500,
    });
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    const reviews = await YesCityReview.find().populate({
      path: 'createdBy',
      model: 'User',
      select: 'username email profileImage',
    });

    return new Response(
      JSON.stringify({
        message: 'Reviews fetched successfully!',
        success: true,
        reviews,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error', success: false }), {
      status: 500,
    });
  }
}
