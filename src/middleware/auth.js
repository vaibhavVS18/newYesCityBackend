// middleware/auth.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * withAuth middleware
 * @param {Function} handler - the handler function
 * @param {Object} options - config
 * @param {boolean} options.optional - if true → allows guests (req.user = null)
 */
export function withAuth(handler, { optional = false } = {}) {
  return async (req, context) => {
    try {
      // ✅ get cookies
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;

      if (!token) {
        if (optional) {
          req.user = null; // guest
          return handler(req, context);
        }
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        if (optional) {
          req.user = null; // guest
          return handler(req, context);
        }
        return NextResponse.json(
          { message: "Invalid or expired token" },
          { status: 403 }
        );
      }

      // ✅ connect DB and fetch user
      await connectToDatabase();
      const user = await User.findById(decoded.userId);
      if (!user) {
        if (optional) {
          req.user = null;
          return handler(req, context);
        }
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      // ✅ check premium expiry
      if (
        user.isPremium !== "FREE" &&
        user.premiumExpiryDate &&
        user.premiumExpiryDate < Date.now()
      ) {
        user.isPremium = "FREE";
        user.premiumStartDate = new Date();
        user.premiumExpiryDate = null;
        await user.save();
      }

      // ✅ attach merged info
      req.user = {
        ...decoded,
        userId: user._id.toString(),
        isPremium: user.isPremium,
        premiumStartDate: user.premiumStartDate,
        premiumExpiryDate: user.premiumExpiryDate,
      };

      return handler(req, context);
    } catch (err) {
      console.error("withAuth error:", err);
      if (optional) {
        req.user = null;
        return handler(req, context);
      }
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  };
}
