import mongoose from "mongoose";

const { Schema } = mongoose;



// Shopping Schema
const shoppingSchema = new Schema({
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
            cityName: { type: String }, // Optional, for quick access or display

  engagement: {views: { type: Number, default: 0 },},
  // ✅ Add array of Review references
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  shops: { type: String, required: true },
  "lat-lon": { type: String, required: true },
  address: { type: String, required: true },
  "location-link": { type: String },
  "famous-for": { type: String },
  "price-range": { type: String },
  "open-day": { type: String },
  "open-time": { type: String },
  phone: { type: String },
  website: { type: String },
  image0: { type: String },
  image1: { type: String },
  image2: { type: String },

    // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});

const Shopping = mongoose.models.Shopping || mongoose.model("Shopping", shoppingSchema);
export default Shopping;
