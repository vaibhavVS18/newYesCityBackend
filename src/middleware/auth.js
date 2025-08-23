// // middleware/auth.js

// middleware/auth.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function withAuth(handler) {
  return async (req, context) => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 403 }
      );
    }

    // ✅ connect DB and fetch user
    await connectToDatabase();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ✅ check expiry + reset if needed
    if (
      user.isPremium !== "FREE" &&
      user.premiumExpiryDate &&
      user.premiumExpiryDate < Date.now()
    ) {
      user.isPremium = "FREE";
      user.premiumStartDate = new Date(); // reset to now
      user.premiumExpiryDate = null;
      await user.save();
    }

    // ✅ attach merged info (decoded + DB overrides)
    req.user = {
      ...decoded, // keeps email, iat, exp, etc.
      userId: user._id.toString(),
      isPremium: user.isPremium,
      premiumStartDate: user.premiumStartDate,
      premiumExpiryDate: user.premiumExpiryDate,
    };

      console.log(req.user);
    // Call the original handler
    return handler(req, context);
  };
}





// import { NextResponse } from 'next/server';
// import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET;

// export function verifyToken(token) {
//   try {
//     return jwt.verify(token, JWT_SECRET);
//   } catch (error) {
//     return null;
//   }
// }

// export function withAuth(handler) {
//   return async (req, context) => {
//     const authHeader = req.headers.get('authorization');

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     const token = authHeader.split(' ')[1];
//     const decoded = verifyToken(token);
//     console.log(decoded);
//     if (!decoded) {
//       return NextResponse.json({ message: 'Invalid or expired token' }, { status: 403 });
//     }

//     // Attach decoded payload to req.user
//     req.user = decoded;

//     // Call the original handler
//     return handler(req, context);
//   };
// }
