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
import "../modules/seats/eventSeatMapLayout.model.js";
import "../modules/seats/seat.model.js";
import "../modules/seats/seatSection.model.js";
import { EventSeatMapLayout } from "../modules/seats/eventSeatMapLayout.model.js";
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
        color: "#0058be",
        displayOrder: 1,
        defaultSeatWidth: 32,
        defaultSeatHeight: 32,
        rows: 2,
        seatsPerRow: 5
      },
      {
        name: "Standard",
        description: "Main seating section.",
        price: 750000,
        color: "#00714d",
        displayOrder: 2,
        defaultSeatWidth: 32,
        defaultSeatHeight: 32,
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
        color: "#a36700",
        displayOrder: 1,
        defaultSeatWidth: 32,
        defaultSeatHeight: 32,
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
          price: sectionData.price,
          color: sectionData.color,
          displayOrder: sectionData.displayOrder,
          defaultSeatWidth: sectionData.defaultSeatWidth,
          defaultSeatHeight: sectionData.defaultSeatHeight
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
    await seedEventSeatMapLayout(event, adminUser);
    console.log(`Seeded demo event: ${event.name}`);
  }
}

async function seedEventSeatMapLayout(event, adminUser) {
  await EventSeatMapLayout.findOneAndUpdate(
    { eventId: event._id },
    {
      $setOnInsert: {
        eventId: event._id,
        canvasWidth: 960,
        canvasHeight: 640,
        gridSize: 16,
        stage: {
          x: 280,
          y: 48,
          width: 400,
          height: 72,
          label: "Stage"
        },
        defaultZoom: 1,
        viewport: {
          x: 0,
          y: 0,
          zoom: 1
        },
        version: 1,
        updatedBy: adminUser?._id || null
      }
    },
    { new: true, upsert: true, runValidators: true }
  );

  const sections = await SeatSection.find({ eventId: event._id }).sort({ displayOrder: 1, name: 1, _id: 1 }).lean();

  for (const [sectionIndex, section] of sections.entries()) {
    const startX = 180 + sectionIndex * 280;
    const startY = 180;
    const gapX = 42;
    const gapY = 44;
    const seats = await Seat.find({ eventId: event._id, sectionId: section._id }).sort({ rowNumber: 1, seatNumber: 1 });

    for (const seat of seats) {
      const rowLabel = getSeedRowLabel(seat.rowNumber);
      await Seat.updateOne(
        { _id: seat._id, "layout.x": { $exists: false }, "layout.y": { $exists: false } },
        {
          $set: {
            layout: {
              x: startX + (seat.seatNumber - 1) * gapX,
              y: startY + (seat.rowNumber - 1) * gapY,
              rotation: 0,
              width: section.defaultSeatWidth || 32,
              height: section.defaultSeatHeight || 32,
              label: `${rowLabel}${seat.seatNumber}`,
              rowLabel,
              isPlaced: true
            }
          }
        },
        { runValidators: true }
      );
    }
  }
}

function getSeedRowLabel(rowNumber) {
  let value = Number(rowNumber);
  let label = "";

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label || String(rowNumber);
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
