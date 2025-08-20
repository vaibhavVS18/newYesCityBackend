import mongoose from "mongoose";

const { Schema } = mongoose;

// City Schema
const citySchema = new Schema({
  engagement: {
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },  
 "cityName": { type: String, required: true },
 "cover-image": { type: String, required: true },
  content: {type: String},
});

const City = mongoose.models.City || mongoose.model("City", citySchema);

export default City;

