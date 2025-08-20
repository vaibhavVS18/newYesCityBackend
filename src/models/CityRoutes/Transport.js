import mongoose from "mongoose";

const { Schema } = mongoose;


// Local Transport Schema
const localTransportSchema = new Schema({
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    cityName: { type: String }, // Optional, for quick access or display
  
  engagement: {
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  from: { type: String, required: true },
  to: { type: String, required: true },
  "auto-price": { type: Number, required: true },
  "cab-price": { type: Number, required: true },
  "bike-price": { type: Number, required: true },

    // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});

const LocalTransport = mongoose.models.LocalTransport || mongoose.model("LocalTransport", localTransportSchema);
export default LocalTransport;
