import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectMongo() {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed.", error.message);
    throw error;
  }
}
