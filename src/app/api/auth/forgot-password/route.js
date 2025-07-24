import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';

// In a real application, you would use a proper email service
// like SendGrid, Mailgun, or AWS SES to send emails
import nodemailer from 'nodemailer';

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`; // Replace with your real frontend URL

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // your Gmail address
      pass: process.env.EMAIL_PASS, // Gmail app password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <p>You requested a password reset.</p>
      <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};


export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ message: 'Email is required', success: false }), {
        status: 400,
      });
    }

    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists for security reasons
    if (!user) {
      return new Response(
        JSON.stringify({
          message: 'If your email is registered, you will receive a password reset link',
          success: true,
        }),
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Update user with reset token
    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken);

    return new Response(
      JSON.stringify({
        message: 'If your email is registered, you will receive a password reset link',
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
