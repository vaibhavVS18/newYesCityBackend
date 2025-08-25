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
  },
  googleId: {
    type: String,
  },
  profileImage: {
    type: String,
    default: 'https://i.pinimg.com/736x/57/00/c0/5700c04197ee9a4372a35ef16eb78f4e.jpg',
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  wishlist: [
    {
      parentRef: { type: mongoose.Schema.Types.ObjectId, required: true },
      onModel: {
        type: String,
        required: true,
        enum: [
          'Accommodation',
          'Activity',
          'CityInfo',
          'Connectivity',
          'Food',
          'HiddenGem',
          'Itinerary',
          'Misc',
          'NearbySpot',
          'Place',
          'Shop',
          'Transport',
        ],
      },
    },
  ],
  isPremium: {
    type: String,
    enum: ['FREE', 'A', 'B'],
    default: 'FREE',
  },
premiumStartDate: {
  type: Date,
  default: Date.now,
},
premiumExpiryDate: {
  type: Date,
  default: null,   // 👈 means "infinite / no expiry"
},
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
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
