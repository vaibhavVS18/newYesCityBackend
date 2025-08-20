import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Place from "@/models/CityRoutes/Place";
import { withAuth } from "@/middleware/auth"; // ✅ for login protection

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id reviews places category lat-lon address location-link open-day open-time establish-year fee description essential story image0 image1 image2 video premium";

    // ✅ Logged-in user
    const userId = req.user.userId;

    // ✅ Find & update engagement
    const updatedPlace = await Place.findOneAndUpdate(
      {
        _id: id,
        cityName: { $regex: new RegExp(`^${cityName}$`, "i") }, // case-insensitive
      },
      {
        $inc: { "engagement.views": 1 },              // increment views
        $addToSet: { "engagement.viewedBy": userId }, // prevent duplicates
      },
      { new: true } // return updated doc
    ).select(fieldsToSelect);

    if (!updatedPlace) {
      return NextResponse.json(
        { success: false, message: "Place not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedPlace });
  } catch (error) {
    console.error("Error fetching place:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Protect with auth
export const GET = withAuth(handler);
