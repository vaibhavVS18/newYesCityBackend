import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Activity from "@/models/CityRoutes/Activity";
import { withAuth } from "@/middleware/auth"; // ✅ ensures user is logged in

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect = "_id reviews top-activities best-places description essential fee image video premium";
    // ✅ Always logged-in user (thanks to withAuth)
    const userId = req.user.userId;

    // ✅ Update engagement and return updated doc
    const updatedActivity = await Activity.findOneAndUpdate(
      {
        _id: id,
        cityName: { $regex: new RegExp(`^${cityName}$`, "i") }, // case-insensitive
      },
      {
        $inc: { "engagement.views": 1 },                // increase views
        $addToSet: { "engagement.viewedBy": userId },   // track unique users
      },
      { new: true } // return updated doc after update
    ).select(fieldsToSelect);

    if (!updatedActivity) {
      return NextResponse.json(
        { success: false, message: "Activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedActivity });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Only accessible to logged-in users
export const GET = withAuth(handler);
