import mongoose from "mongoose";

const { Schema } = mongoose;

// City Schema
const citySchema = new Schema({
 "city-name": { type: String, required: true },
  engagement: {views: { type: Number, default: 0 },},
  content: {type: String},
});

const City = mongoose.models.City || mongoose.model("City", citySchema);

export default City;

