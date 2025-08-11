import mongoose from "mongoose";

const { Schema } = mongoose;




// Itinerary Schema (Multiple Days)
const itinerarySchema = new Schema({
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
        cityName: { type: String }, // Optional, for quick access or display

  engagement: {views: { type: Number, default: 0 },},
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  day1: { type: String, required: true },
  day2: { type: String, required: true },
  day3: { type: String, required: true },

    // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});

const Itinerary = mongoose.models.Itinerary || mongoose.model("Itinerary", itinerarySchema);
export default Itinerary;
