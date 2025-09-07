// app/api/allContribution/[cityName]/route.js
import { connectToDatabase } from "@/lib/db";
import Contribution from "@/models/Contribution";

export async function GET(req, context) {
  try {
    const { cityName } = await context.params; // ✅ get from context

    if (!cityName) {
      return new Response(
        JSON.stringify({ error: "City name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await connectToDatabase(); // ✅ ensure DB is connected

    // Find all contributions with status "approved" for this city
    const contributions = await Contribution.find({
      cityName: decodeURIComponent(cityName),
      status: "approved",
    })
      .sort({ submittedAt: -1 }) // latest first
      .lean();

    return new Response(
      JSON.stringify({ contributions }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching city contributions:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
