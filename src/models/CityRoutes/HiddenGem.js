import mongoose from "mongoose";

const { Schema } = mongoose;




// Hidden Gems Schema
const hiddenGemsSchema = new Schema({
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
        cityName: { type: String }, // Optional, for quick access or display
  engagement: {views: { type: Number, default: 0 },},
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  "hidden-gems": { type: String, required: true },
  category: { type: String },
  "lat-lon": { type: String, required: true },
  address: { type: String },
  "location-link": { type: String },
  "open-day": { type: String },
  "open-time": { type: String },
  "guide-availiblity": { type: String },
  "establish-year": { type: String },
  fee: { type: String },
  description: { type: String },
  essential: { type: String },
  story: { type: String },
  image0: { type: String },
  image1: { type: String },
  image2: { type: String },
  video: { type: String },

    // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});

const HiddenGem = mongoose.models.HiddenGem || mongoose.model("HiddenGem", hiddenGemsSchema);
export default HiddenGem;
