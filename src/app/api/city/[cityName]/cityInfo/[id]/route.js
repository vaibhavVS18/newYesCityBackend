import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CityInfo from "@/models/CityRoutes/CityInfo";
import { withAuth } from "@/middleware/auth"; // ✅ ensures user is logged in

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id cityName stateOrUT alternateNames languagesSpoken climateInfo bestTimeToVisit cityHistory coverImage premium";

    // ✅ Always logged-in user (thanks to withAuth)
    const userId = req.user.userId;

    // ✅ Update engagement and return updated doc
    const updatedCityInfo = await CityInfo.findOneAndUpdate(
      {
        _id: id,
        cityName: { $regex: new RegExp(`^${cityName}$`, "i") }, // case-insensitive match
      },
      {
        $inc: { "engagement.views": 1 },              // increase views
        $addToSet: { "engagement.viewedBy": userId }, // track unique users
      },
      { new: true } // return updated doc
    ).select(fieldsToSelect);

    if (!updatedCityInfo) {
      return NextResponse.json(
        { success: false, message: "City Info not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedCityInfo });
  } catch (error) {
    console.error("Error fetching city info:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Only accessible to logged-in users
export const GET = withAuth(handler);
