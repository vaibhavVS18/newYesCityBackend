// lib/premium.js
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function extendUserPremium(userId) {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();

  if (user.isPremium === "FREE") {
    user.isPremium = "A";
    user.premiumStartDate = now;
    user.premiumExpiryDate = new Date(now.getTime() + thirtyDays);
  } else {
    const currentExpiry = user.premiumExpiryDate ? new Date(user.premiumExpiryDate) : now;
    user.premiumExpiryDate = new Date(
      currentExpiry > now ? currentExpiry.getTime() + thirtyDays : now.getTime() + thirtyDays
    );
  }

  await user.save();
  return user;
}
