import mongoose from "mongoose";

export async function dbConnect() {
  await mongoose.connect(process.env.DB_CONNECT);
  console.log("MongoDB connected");
}
