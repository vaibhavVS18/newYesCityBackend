import mongoose from "mongoose";

const { Schema } = mongoose;


// Nearby Tourist Spot Schema
const nearbyTouristSpotSchema = new Schema({
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
            cityName: { type: String }, // Optional, for quick access or display
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
            
  engagement: {views: { type: Number, default: 0 },},
  
  places: { type: String, required: true },
  distance: { type: String, required: true },
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

const NearbyTouristSpot = mongoose.models.NearbyTouristSpot || mongoose.model("NearbyTouristSpot", nearbyTouristSpotSchema);
export default NearbyTouristSpot;
