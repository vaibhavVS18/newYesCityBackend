import mongoose from "mongoose";

const { Schema } = mongoose;

// Contribution Schema
const contributionSchema = new Schema({
  userId: { type: String, required: true },
  cityName: { type: String }, // Optional, for quick access or display
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  username: { type: String },
  category: { type: String, required: true }, // e.g., "food", "placesToVisit"
  title: { type: String, required: true },
  description: { type: String },
  images: [String],
  video: { type: String },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminRemarks: { type: String },

    // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});

const Contribution = mongoose.models.Contribution || mongoose.model("Contribution", contributionSchema);
export default Contribution;
