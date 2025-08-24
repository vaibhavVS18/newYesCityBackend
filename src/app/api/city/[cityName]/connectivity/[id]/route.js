import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Connectivity from "@/models/CityRoutes/Connectivity";
import { withAuth } from "@/middleware/auth"; // ✅ ensures user is logged in

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id cityName reviews nearestAirportStationBusStand distance lat lon locationLink majorFlightsTrainsBuses premium";

    // ✅ Always logged-in user (thanks to withAuth)
    const userId = req.user.userId;

    // ✅ Update engagement and return updated doc
    const updatedConnectivity = await Connectivity.findOneAndUpdate(
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

    if (!updatedConnectivity) {
      return NextResponse.json(
        { success: false, message: "Connectivity info not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedConnectivity });
  } catch (error) {
    console.error("Error fetching connectivity:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Only accessible to logged-in users
export const GET = withAuth(handler);
