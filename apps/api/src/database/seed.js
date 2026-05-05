import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ROLES } from "../common/constants/index.js";
import { env } from "../config/env.js";
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
import { upsertRoleByName } from "../modules/users/role.repository.js";
import { findUserByEmail, findUserByUsername, upsertUserByEmail } from "../modules/users/user.repository.js";
import "../modules/waiting-queue/waitingQueue.model.js";
import { connectMongo } from "./connectMongo.js";

const demoAccounts = [
  {
    username: "admin",
    email: "admin@example.com",
    password: "Admin@123456",
    fullName: "Demo Admin",
    gender: "Other",
    roleName: ROLES.ADMIN
  },
  {
    username: "customer",
    email: "customer@example.com",
    password: "Customer@123456",
    fullName: "Demo Customer",
    gender: "Other",
    roleName: ROLES.CUSTOMER
  }
];

async function seedRoles() {
  const rolesByName = new Map();

  for (const roleName of [ROLES.CUSTOMER, ROLES.ADMIN]) {
    const role = await upsertRoleByName(roleName);
    rolesByName.set(roleName, role);
  }

  return rolesByName;
}

async function seedDemoUsers(rolesByName) {
  for (const account of demoAccounts) {
    const role = rolesByName.get(account.roleName);
    const existingByUsername = await findUserByUsername(account.username, { populateRoles: false });
    const existingByEmail = await findUserByEmail(account.email, { populateRoles: false });

    if (existingByUsername && existingByEmail && existingByUsername._id.toString() !== existingByEmail._id.toString()) {
      console.warn(
        `Skipped ${account.email}: username ${account.username} and email already belong to different users.`
      );
      continue;
    }

    if (existingByEmail || existingByUsername) {
      console.log(`Demo user already exists: ${account.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(account.password, env.BCRYPT_SALT_ROUNDS);

    await upsertUserByEmail(account.email, {
      username: account.username,
      passwordHash,
      fullName: account.fullName,
      gender: account.gender,
      roles: [role._id]
    });

    console.log(`Seeded demo user: ${account.email}`);
  }
}

async function runSeed() {
  await connectMongo();

  const rolesByName = await seedRoles();
  await seedDemoUsers(rolesByName);

  console.log("Seed completed.");
  console.log("Demo credentials:");
  console.log("Admin: admin@example.com / Admin@123456");
  console.log("Customer: customer@example.com / Customer@123456");
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
