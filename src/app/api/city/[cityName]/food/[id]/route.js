import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Food from "@/models/CityRoutes/Food";
import { withAuth } from "@/middleware/auth"; // ✅ ensures user is logged in

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id flagShip reviews food-place lat-lon address location-link category veg/non-veg value-for-money service taste hygiene menu-special menu-link open-day open-time phone website description image0 image1 image2 video premium";

    // ✅ Always logged-in user (thanks to withAuth)
    const userId = req.user.userId;

    // ✅ Update engagement + return updated document
    const updatedFood = await Food.findOneAndUpdate(
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

    if (!updatedFood) {
      return NextResponse.json(
        { success: false, message: "Food place not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedFood });
  } catch (error) {
    console.error("Error fetching food place:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Only accessible to logged-in users
export const GET = withAuth(handler);
