// app/api/user/upgrade/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { withAuth } from "@/middleware/auth"; // 👈 ensures req.user is available

async function handler(req) {
  await connectToDatabase();

  try {
    const userId = req.user.userId; // 👈 from auth middleware

    // 90 days in ms
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isPremium: "A",
        premiumStartDate: new Date(),
        premiumExpiryDate: new Date(Date.now() + ninetyDays),
      },
      { new: true } // return updated doc
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User upgraded to Premium A for 90 days",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        isPremium: updatedUser.isPremium,
        premiumStartDate: updatedUser.premiumStartDate,
        premiumExpiryDate: updatedUser.premiumExpiryDate,
      },
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
