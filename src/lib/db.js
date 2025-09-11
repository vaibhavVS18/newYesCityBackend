import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  return mongoose.connect(MONGO_URI, {
    dbName: 'newDatabaseName', // 👈 your new database here
  });
}

// Default export kept for modules that import the legacy default (dbConnect)
export default connectToDatabase;
