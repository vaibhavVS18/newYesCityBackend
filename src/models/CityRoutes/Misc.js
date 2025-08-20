import mongoose from "mongoose";

const { Schema } = mongoose;


// Miscellaneous Schema
const miscellaneousSchema = new Schema({
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    cityName: { type: String }, // Optional, for quick access or display

  engagement: {
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  
  "local-map": { type: String },
  "emergency-contacts": { type: String },
  "hospitals/police-station": { type: String },
  "location-link": { type: String },
  "lat-lon": { type: String },
  parking: { type: String },
  "public-washrooms": { type: String },

    // ✅ New premium field with enum
  premium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },
});

const Miscellaneous = mongoose.models.Miscellaneous || mongoose.model("Miscellaneous", miscellaneousSchema);
export default Miscellaneous;
