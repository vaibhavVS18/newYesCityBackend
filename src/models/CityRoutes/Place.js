import mongoose from "mongoose";

const { Schema } = mongoose;


// Places to Visit Schema
const placesToVisitSchema = new Schema({
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
            cityName: { type: String }, // Optional, for quick access or display

  engagement: {
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  

  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  places: { type: String, required: true },
  category: { type: String, required: true },
  "lat-lon": { type: String, required: true },
  address: { type: String, required: true },
  "location-link": { type: String, required: true },
  "open-day": { type: String, required: true },
  "open-time": { type: String, required: true },
  "establish-year": { type: String, required: true },
  fee: { type: String, required: true },
  description: { type: String, required: true },
  essential: { type: String, required: true },
  story: { type: String, required: true },
  image0: { type: String, required: true },
  image1: { type: String, required: true },
  image2: { type: String, required: true },
  video: { type: String, required: true },

    // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});


const PlacesToVisit = mongoose.models.PlacesToVisit || mongoose.model("PlacesToVisit", placesToVisitSchema);
export default PlacesToVisit;
