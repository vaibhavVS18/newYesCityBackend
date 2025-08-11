import mongoose from "mongoose";

const { Schema } = mongoose;



// Food Schema
const foodSchema = new Schema({
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    cityName: { type: String , default: false}, // Optional, for quick access or display
  engagement: {views: { type: Number, default: 0 },},
  flagShip: {type: Boolean, default: false},

  // ✅ Add array of Review references
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  "food-place": { type: String, required: true },
  "lat-lon": { type: String, required: true },
  address: { type: String, required: true },
  "location-link": { type: String },
  category: { type: String },
  "veg/non-veg": { type: String },
  "value-for-money": { type: Number },
  service: { type: Number },
  taste: { type: Number },
  hygiene: { type: Number },
  "menu-special": { type: String },
  "menu-link": { type: String },
  "open-day": { type: String },
  "open-time": { type: String },
  phone: { type: String },
  website: { type: String },
  description: { type: String },
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

const Food = mongoose.models.Food || mongoose.model("Food", foodSchema);
export default Food;
