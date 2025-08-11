import mongoose from "mongoose";

const { Schema } = mongoose;

// General City Info Schema
const generalCityInfoSchema = new Schema({
  cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],

  engagement: { views: { type: Number, default: 0 } },
 
  "cityName": { type: String, required: true },
  "state/union-territory": { type: String, required: true },
  "alternate-names": { type: String },
  "languages-spoken": { type: String, required: true },
  "climate-info": { type: String, required: true },
  "best-time-to-visit": { type: String, required: true },
  "city-history": { type: String, required: true },
  "cover-image": { type: String, required: true },

    // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});

// ✅ Export with proper model check
const CityInfo = mongoose.models.CityInfo || mongoose.model("CityInfo", generalCityInfoSchema);
export default CityInfo;
