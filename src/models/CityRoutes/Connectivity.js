import mongoose from "mongoose";

const { Schema } = mongoose;

// Connectivity (Transportation Hub) Schema
const connectivitySchema = new Schema({
  cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
     cityName: { type: String }, // Optional, for quick access or display
  engagement: { views: { type: Number, default: 0 } },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  
  "nearest-airport/station/bus-stand": { type: String, required: true },
  distance: { type: String, required: true },
  "lat-lon": { type: String, required: true },
  "location-link": { type: String, required: true },
  "major-flights/trains/buses": { type: String },

    // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});

// ✅ Export with proper model check
const Connectivity = mongoose.models.Connectivity || mongoose.model("Connectivity", connectivitySchema);
export default Connectivity;
