import mongoose from "mongoose";
import "../modules/admin/auditLog.model.js";
import "../modules/bookings/order.model.js";
import "../modules/events/eventImage.model.js";
import "../modules/events/event.model.js";
import "../modules/seats/seatLock.model.js";
import "../modules/seats/seat.model.js";
import "../modules/seats/seatSection.model.js";
import "../modules/tickets/ticket.model.js";
import "../modules/users/role.model.js";
import "../modules/users/user.model.js";
import "../modules/waiting-queue/waitingQueue.model.js";
import { connectMongo } from "./connectMongo.js";

async function runSeed() {
  await connectMongo();
  console.log("Mongoose models loaded. Real seed data will be implemented in later phases.");
  console.log("No collections were cleared and no documents were inserted.");
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
