import mongoose from "mongoose";

const { Schema } = mongoose;

// Activities Schema
const activitiesSchema = new Schema({
  cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
  cityName: { type: String }, // Optional, for quick access or display

  // ✅ Engagement tracking
  engagement: {
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },

  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  "top-activities": { type: String, required: true },
  "best-places": { type: String, required: true },
  description: { type: String, required: true },
  essential: { type: String, required: true },
  fee: { type: String, required: true },
  image: { type: String, required: true },
  video: { type: String, required: true },

  // ✅ Premium access field
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE"
  },
});

// ✅ Export with proper model check
const Activity =
  mongoose.models.Activity || mongoose.model("Activity", activitiesSchema);

export default Activity;
