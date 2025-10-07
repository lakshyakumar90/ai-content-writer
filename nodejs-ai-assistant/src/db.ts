import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI as string;
if (!mongoUri) {
  throw new Error("Missing MONGO_URI");
}

export async function connectDb() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}


