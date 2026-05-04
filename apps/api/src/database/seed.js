import mongoose from "mongoose";
import { connectMongo } from "./connectMongo.js";

async function runSeed() {
  await connectMongo();
  console.log("Seed is not implemented yet. No data was created.");
}

runSeed()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed.", error.message);
    await mongoose.connection.close();
    process.exit(1);
  });
