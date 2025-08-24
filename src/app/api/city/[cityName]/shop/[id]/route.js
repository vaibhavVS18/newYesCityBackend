import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Shop from "@/models/CityRoutes/Shop";
import { withAuth } from "@/middleware/auth";

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id cityName flagship reviews shops lat lon address locationLink famousFor priceRange openDay openTime phone website images premium";

    // ✅ Logged-in user
    const userId = req.user.userId;

    // ✅ Update engagement on view
    const updatedShop = await Shop.findOneAndUpdate(
      {
        _id: id,
        cityName: { $regex: new RegExp(`^${cityName}$`, "i") }, // case-insensitive
      },
      {
        $inc: { "engagement.views": 1 },              // increment views
        $addToSet: { "engagement.viewedBy": userId }, // unique user
      },
      { new: true }
    ).select(fieldsToSelect);

    if (!updatedShop) {
      return NextResponse.json(
        { success: false, message: "Shop not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedShop });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
