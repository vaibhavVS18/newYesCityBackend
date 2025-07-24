// pages/api/auth/signup.js
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db'; // Utility to connect to MongoDB
import User from '@/models/User';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    // Validate input fields
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ message: 'All fields are required.', success: false }), {
        status: 400,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ message: 'Please enter a valid email address.', success: false }),
        {
          status: 400,
        }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ message: 'Password must be at least 8 characters long.', success: false }),
        {
          status: 400,
        }
      );
    }

    await connectToDatabase();

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return new Response(JSON.stringify({ message: 'Email already in use.', success: false }), {
        status: 400,
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return new Response(JSON.stringify({ message: 'Username already taken.', success: false }), {
        status: 400,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        message: 'Account created successfully',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
        success: true,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
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
