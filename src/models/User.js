import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  resetToken: String,
  resetTokenExpiry: Date,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
