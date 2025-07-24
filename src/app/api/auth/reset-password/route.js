import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return new Response(
        JSON.stringify({ message: 'Token and password are required', success: false }),
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ message: 'Password must be at least 8 characters long', success: false }),
        { status: 400 }
      );
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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with new password and clear reset token fields
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined,
      lastLogin: new Date(),
    });

    return new Response(
      JSON.stringify({
        message: 'Password has been reset successfully',
        success: true,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
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
