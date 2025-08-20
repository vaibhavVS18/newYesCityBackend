// import { NextResponse } from "next/server";
// import { connectToDatabase } from "@/lib/db";
// import Accommodation from "@/models/CityRoutes/Accommodation";
// import { withAuth } from "@/middleware/auth"; // ✅ ensures user is logged in
// import User from "@/models/User"; // 👈 ADD THIS

// async function handler(req, context) {
//   const { cityName, id } = await context.params;

//   await connectToDatabase();

//   try {
//     const fieldsToSelect =
//       "reviews hotels lat-lon address location-link category types-of-room-price facilities image0 image1 image2 premium engagement";

//     // ✅ Always logged-in user (thanks to withAuth)
//     const userId = req.user.userId;

//     // ✅ Update engagement and return updated doc
//     const updatedAccommodation = await Accommodation.findOneAndUpdate(
//       {
//         _id: id,
//         cityName: { $regex: new RegExp(`^${cityName}$`, "i") }, // case-insensitive
//       },
//       {
//         $inc: { "engagement.views": 1 },                // increase views
//         $addToSet: { "engagement.viewedBy": userId },   // track unique users
//       },
//       { new: true } // return updated doc after update
//     )
//       .select(fieldsToSelect);
//       // .populate({
//       //   path: "reviews",
//       //   select: "rating content date createdBy", // ✅ main review fields
//       //   populate: {
//       //     path: "createdBy",
//       //     select: "username profileImage", // ✅ only show useful user info
//       //   },
//       // });

//     if (!updatedAccommodation) {
//       return NextResponse.json(
//         { success: false, message: "Accommodation not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ success: true, data: updatedAccommodation });
//   } catch (error) {
//     console.error("Error fetching accommodation:", error);
//     return NextResponse.json(
//       { success: false, error: "Server error" },
//       { status: 500 }
//     );
//   }
// }

// // ✅ Only accessible to logged-in users
// export const GET = withAuth(handler);




import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Accommodation from "@/models/CityRoutes/Accommodation";
import { withAuth } from "@/middleware/auth"; 
import User from "@/models/User"; 

// ✅ Helper: what premium levels the user can access
function getAccessiblePremiums(userPremium) {
  if (userPremium === "B") return ["FREE", "A", "B"];
  if (userPremium === "A") return ["FREE", "A"];
  return ["FREE"];
}

async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "reviews hotels lat-lon address location-link category types-of-room-price facilities image0 image1 image2 premium engagement";

    // ✅ Logged-in user
    const userId = req.user.userId;
    const user = await User.findById(userId).select("premium");
    const userPremium = user?.premium || "FREE";

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // ✅ Directly update + return in one query
    const updatedAccommodation = await Accommodation.findOneAndUpdate(
      {
        _id: id,
        cityName: { $regex: new RegExp(`^${cityName}$`, "i") },
        premium: { $in: accessiblePremiums }, // 👈 restrict by premium level
      },
      {
        $inc: { "engagement.views": 1 },              // increase views
        $addToSet: { "engagement.viewedBy": userId }, // unique users
      },
      { new: true, projection: fieldsToSelect } // return updated doc
    );

    if (!updatedAccommodation) {
      return NextResponse.json(
        { success: false, message: "Not authorized or accommodation not found" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: updatedAccommodation });
  } catch (error) {
    console.error("Error fetching accommodation:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Only accessible to logged-in users
export const GET = withAuth(handler);
