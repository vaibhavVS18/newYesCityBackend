import mongoose from "mongoose";

const { Schema } = mongoose;

// Accommodation Schema
const accommodationSchema = new Schema({
  cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
  cityName: { type: String }, // Optional, for quick access or display
  engagement: { views: { type: Number, default: 0 } },

  // ✅ Array of Review references
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  hotels: { type: String, required: true },
  "lat-lon": { type: String, required: true },
  address: { type: String, required: true },
  "location-link": { type: String },
  category: { type: String },
  "types-of-room-price": { type: String },
  facilities: { type: String },
  image0: { type: String },
  image1: { type: String },
  image2: {type: String},

  // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});

// ✅ Proper model check
const Accommodation = mongoose.models.Accommodation || mongoose.model("Accommodation", accommodationSchema);

export default Accommodation;
