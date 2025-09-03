async function handler(req, context) {
  const { cityName, id } = await context.params;

  await connectToDatabase();

  try {
    const fieldsToSelect =
      "_id cityName flagship reviews hotels lat lon address locationLink category roomTypes facilities images premium engagement";

    // Logged-in user
    const userId = req.user.userId;
    const user = await User.findById(userId).select("premium");
    const userPremium = user?.premium || "FREE";

    const accessiblePremiums = getAccessiblePremiums(userPremium);

    // 1️⃣ Check if the user already exists in viewedBy
    const accommodation = await Accommodation.findOne({
      _id: id,
      cityName: { $regex: new RegExp(`^${cityName}$`, "i") },
      premium: { $in: accessiblePremiums },
    });

    if (!accommodation) {
      return NextResponse.json(
        { success: false, message: "Not authorized or accommodation not found" },
        { status: 403 }
      );
    }

    // 2️⃣ Increment views
    accommodation.engagement.views += 1;

    // 3️⃣ Find the user in viewedBy
    const userEntry = accommodation.engagement.viewedBy.find(
      (entry) => entry.userId.toString() === userId
    );

    if (userEntry) {
      // ✅ User exists → add new timestamp
      userEntry.timestamps.push(new Date());
    } else {
      // ✅ User not present → add new entry with timestamp
      accommodation.engagement.viewedBy.push({
        userId,
        timestamps: [new Date()],
      });
    }

    await accommodation.save();

    // 4️⃣ Return updated document
    const updatedAccommodation = await Accommodation.findById(id).select(fieldsToSelect);

    return NextResponse.json({ success: true, data: updatedAccommodation });
  } catch (error) {
    console.error("Error fetching accommodation:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
