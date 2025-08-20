import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import NearbySpot from "@/models/CityRoutes/NearbySpot";
import { withAuth } from "@/middleware/auth"; // ✅ protects route

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id reviews places distance category lat-lon address location-link open-day open-time establish-year fee description essential story image0 image1 image2 video premium";

    // ✅ Logged-in user
    const userId = req.user.userId;

    // ✅ Find & update engagement
    const updatedSpot = await NearbySpot.findOneAndUpdate(
      {
        _id: id,
        cityName: { $regex: new RegExp(`^${cityName}$`, "i") }, // case-insensitive
      },
      {
        $inc: { "engagement.views": 1 },              // increment views
        $addToSet: { "engagement.viewedBy": userId }, // unique viewer
      },
      { new: true } // return updated doc
    ).select(fieldsToSelect);

    if (!updatedSpot) {
      return NextResponse.json(
        { success: false, message: "Nearby tourist spot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedSpot });
  } catch (error) {
    console.error("Error fetching nearby tourist spot:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Wrap with auth middleware
export const GET = withAuth(handler);
