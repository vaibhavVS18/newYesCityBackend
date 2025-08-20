import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import HiddenGem from "@/models/CityRoutes/HiddenGem";
import { withAuth } from "@/middleware/auth"; // ✅ ensures user is logged in

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id hidden-gems category lat-lon address location-link open-day open-time guide-availiblity establish-year fee description essential story image0 image1 image2 video premium";

    // ✅ Always logged-in user (thanks to withAuth)
    const userId = req.user.userId;

    // ✅ Update engagement + return updated document
    const updatedGem = await HiddenGem.findOneAndUpdate(
      {
        _id: id,
        cityName: { $regex: new RegExp(`^${cityName}$`, "i") }, // case-insensitive
      },
      {
        $inc: { "engagement.views": 1 },              // increase views
        $addToSet: { "engagement.viewedBy": userId }, // track unique users
      },
      { new: true } // return updated doc
    ).select(fieldsToSelect);

    if (!updatedGem) {
      return NextResponse.json(
        { success: false, message: "Hidden Gem not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedGem });
  } catch (error) {
    console.error("Error fetching hidden gem:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Only accessible to logged-in users
export const GET = withAuth(handler);
