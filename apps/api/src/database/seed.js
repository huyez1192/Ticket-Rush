import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { EVENT_STATUSES, ROLES, SEAT_STATUSES } from "../common/constants/index.js";
import { env } from "../config/env.js";
import "../modules/admin/auditLog.model.js";
import "../modules/bookings/order.model.js";
import "../modules/events/eventImage.model.js";
import "../modules/events/event.model.js";
import { EventImage } from "../modules/events/eventImage.model.js";
import { Event } from "../modules/events/event.model.js";
import "../modules/seats/seatLock.model.js";
import "../modules/seats/seat.model.js";
import "../modules/seats/seatSection.model.js";
import { Seat } from "../modules/seats/seat.model.js";
import { SeatSection } from "../modules/seats/seatSection.model.js";
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

const demoEvents = [
  {
    name: "TicketRush Music Festival 2026",
    description: "A public demo concert event for customer browsing and seat-map testing.",
    startTime: new Date("2026-08-20T19:00:00.000Z"),
    endTime: new Date("2026-08-20T22:30:00.000Z"),
    location: "My Dinh Stadium, Hanoi",
    status: EVENT_STATUSES.SELLING,
    images: [
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
    ],
    sections: [
      {
        name: "VIP",
        description: "Front section near the stage.",
        price: 1500000,
        rows: 2,
        seatsPerRow: 5
      },
      {
        name: "Standard",
        description: "Main seating section.",
        price: 750000,
        rows: 2,
        seatsPerRow: 5
      }
    ]
  },
  {
    name: "TicketRush Theater Night",
    description: "A public demo theater event for event listing filters.",
    startTime: new Date("2026-09-12T13:00:00.000Z"),
    endTime: new Date("2026-09-12T15:30:00.000Z"),
    location: "Saigon Opera House, Ho Chi Minh City",
    status: EVENT_STATUSES.PUBLISHED,
    images: ["https://images.unsplash.com/photo-1503095396549-807759245b35"],
    sections: [
      {
        name: "Balcony",
        description: "Upper balcony seating.",
        price: 450000,
        rows: 1,
        seatsPerRow: 6
      }
    ]
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

async function upsertDemoEvent(eventData, adminUser) {
  return Event.findOneAndUpdate(
    { name: eventData.name },
    {
      $set: {
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location,
        status: eventData.status,
        createdBy: adminUser?._id || null
      }
    },
    { new: true, upsert: true, runValidators: true }
  );
}

async function seedEventImages(event, imageUrls) {
  for (const imageUrl of imageUrls) {
    await EventImage.findOneAndUpdate(
      { eventId: event._id, imageUrl },
      { $setOnInsert: { eventId: event._id, imageUrl } },
      { new: true, upsert: true }
    );
  }
}

async function seedSectionSeats(section, rows, seatsPerRow) {
  for (let rowNumber = 1; rowNumber <= rows; rowNumber += 1) {
    for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber += 1) {
      await Seat.findOneAndUpdate(
        {
          sectionId: section._id,
          rowNumber,
          seatNumber
        },
        {
          $setOnInsert: {
            eventId: section.eventId,
            sectionId: section._id,
            rowNumber,
            seatNumber,
            status: SEAT_STATUSES.AVAILABLE
          }
        },
        { new: true, upsert: true, runValidators: true }
      );
    }
  }
}

async function seedEventSections(event, sections) {
  for (const sectionData of sections) {
    const section = await SeatSection.findOneAndUpdate(
      { eventId: event._id, name: sectionData.name },
      {
        $set: {
          eventId: event._id,
          name: sectionData.name,
          description: sectionData.description,
          price: sectionData.price
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    await seedSectionSeats(section, sectionData.rows, sectionData.seatsPerRow);
  }
}

async function seedDemoEvents() {
  const adminUser = await findUserByEmail("admin@example.com", { populateRoles: false });

  for (const eventData of demoEvents) {
    const event = await upsertDemoEvent(eventData, adminUser);
    await seedEventImages(event, eventData.images);
    await seedEventSections(event, eventData.sections);
    console.log(`Seeded demo event: ${event.name}`);
  }
}

async function runSeed() {
  await connectMongo();

  const rolesByName = await seedRoles();
  await seedDemoUsers(rolesByName);
  await seedDemoEvents();

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
