import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ message: 'Token is required', success: false }), {
        status: 400,
      });
    }

    await connectToDatabase();

    // Find user with this reset token and check if it's still valid
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }, // Token must not be expired
    });

    if (!user) {
      return new Response(JSON.stringify({ message: 'Invalid or expired token', success: false }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: 'Token is valid', success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(
      JSON.stringify({
        message: 'Internal server error',
        error: error.message,
        success: false,
      }),
      { status: 500 }
    );
  }
}
