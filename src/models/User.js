import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // Not required because Google users won't have a password
  },
  googleId: {
    type: String,
    // For Google authenticated users
  },
  profileImage: {
    type: String,
    default: '/assets/default-avatar.jpg',
  },

  wishlist: [
  {
    parentRef: { type: mongoose.Schema.Types.ObjectId, required: true },
    onModel: {
      type: String,
      required: true,
      enum: ['Accommodation', 'Activity', 'CityInfo', 'Connectivity', 'Contribution', 'Food', 'HiddenGem', 'Itinerary', 'Misc', 'NearbySpot', 'Place', 'Shop', 'Transport'],
    },
  },
],

  // ✅ New premium field with enum
  isPremium: {
    type: String,
    enum: ["FREE", "A", "B"],
    default: "FREE" // Optional: set default
  },

  premiumStartDate: {
    type: Date,
  },
  premiumExpiryDate: {
    type: Date,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true, // avoids unique constraint errors for null
  },
  referredBy: {
    type: String,
  },
  contributionPoints: {
    type: Number,
    default: 0,
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  signupDate: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },

  resetToken: String,
  resetTokenExpiry: Date,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
