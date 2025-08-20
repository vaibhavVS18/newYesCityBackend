import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Misc from "@/models/CityRoutes/Misc";
import { withAuth } from "@/middleware/auth"; // ✅ protects route

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id reviews local-map emergency-contacts hospitals/police-station location-link lat-lon parking public-washrooms premium";

    // ✅ Logged-in user
    const userId = req.user.userId;

    // ✅ Find & update engagement
    const updatedMisc = await Misc.findOneAndUpdate(
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

    if (!updatedMisc) {
      return NextResponse.json(
        { success: false, message: "Misc entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedMisc });
  } catch (error) {
    console.error("Error fetching Misc:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Wrap with auth middleware
export const GET = withAuth(handler);
