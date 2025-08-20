import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Transport from "@/models/CityRoutes/Transport";
import { withAuth } from "@/middleware/auth";

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id reviews from to auto-price cab-price bike-price premium";

    // ✅ Logged-in user
    const userId = req.user.userId;

    // ✅ Update engagement on view
    const updatedTransport = await Transport.findOneAndUpdate(
      {
        _id: id,
        cityName: { $regex: new RegExp(`^${cityName}$`, "i") }, // case-insensitive match
      },
      {
        $inc: { "engagement.views": 1 },              // increment views
        $addToSet: { "engagement.viewedBy": userId }, // unique user
      },
      { new: true }
    ).select(fieldsToSelect);

    if (!updatedTransport) {
      return NextResponse.json(
        { success: false, message: "Transport route not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedTransport });
  } catch (error) {
    console.error("Error fetching local transport:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
