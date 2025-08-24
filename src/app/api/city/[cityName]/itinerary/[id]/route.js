import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Itinerary from "@/models/CityRoutes/Itinerary";
import { withAuth } from "@/middleware/auth"; // ✅ ensures only logged-in users

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id cityName reviews day1 day2 day3 premium";

    // ✅ Logged-in user
    const userId = req.user.userId;

    // ✅ Fetch itinerary + track engagement
    const updatedItinerary = await Itinerary.findOneAndUpdate(
      {
        _id: id,
        cityName: { $regex: new RegExp(`^${cityName}$`, "i") }, // case-insensitive match
      },
      {
        $inc: { "engagement.views": 1 },              // increase views
        $addToSet: { "engagement.viewedBy": userId }, // track unique viewers
      },
      { new: true } // return updated doc
    ).select(fieldsToSelect);

    if (!updatedItinerary) {
      return NextResponse.json(
        { success: false, message: "Itinerary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedItinerary });
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Wrap with auth middleware
export const GET = withAuth(handler);
