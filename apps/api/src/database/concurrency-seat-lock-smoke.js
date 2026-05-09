import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { EVENT_STATUSES, ROLES, SEAT_LOCK_STATUSES, SEAT_STATUSES } from "../common/constants/index.js";
import { env } from "../config/env.js";
import "../modules/admin/auditLog.model.js";
import "../modules/bookings/order.model.js";
import { Event } from "../modules/events/event.model.js";
import { getMyActiveSeatLocks, lockSeatsForUser } from "../modules/seats/seatLock.service.js";
import { SeatLock } from "../modules/seats/seatLock.model.js";
import { Seat } from "../modules/seats/seat.model.js";
import { getPublicSeatMap } from "../modules/seats/seat.service.js";
import "../modules/seats/seatSection.model.js";
import "../modules/tickets/ticket.model.js";
import "../modules/users/role.model.js";
import "../modules/users/user.model.js";
import { upsertRoleByName } from "../modules/users/role.repository.js";
import { upsertUserByEmail } from "../modules/users/user.repository.js";
import "../modules/waiting-queue/waitingQueue.model.js";
import { connectMongo } from "./connectMongo.js";

const ATTEMPT_COUNT = 24;

async function ensureSmokeCustomer(email, username) {
  const customerRole = await upsertRoleByName(ROLES.CUSTOMER);
  const passwordHash = await bcrypt.hash("Smoke@123456", env.BCRYPT_SALT_ROUNDS);

  return upsertUserByEmail(email, {
    username,
    passwordHash,
    fullName: `Smoke Customer ${username}`,
    gender: "Other",
    roles: [customerRole._id]
  });
}

async function findTargetSeat() {
  const event = await Event.findOne({ status: EVENT_STATUSES.SELLING }).sort({ startTime: 1, _id: 1 }).lean();

  if (!event) {
    throw new Error("No Selling event found. Run the API seed first.");
  }

  const seat = await Seat.findOne({ eventId: event._id, status: SEAT_STATUSES.AVAILABLE })
    .sort({ sectionId: 1, rowNumber: 1, seatNumber: 1, _id: 1 })
    .lean();

  if (!seat) {
    throw new Error(`No Available seat found for Selling event ${event._id}. Run the seed or release expired locks first.`);
  }

  return { event, seat };
}

function isExpectedConflict(error) {
  return error?.statusCode === 409 && /no longer available|actively locked/i.test(error.message || "");
}

async function runSmoke() {
  await connectMongo();
  await Promise.all([Seat.init(), SeatLock.init(), mongoose.model("OrderItem").init(), mongoose.model("Ticket").init()]);

  const [customerA, customerB] = await Promise.all([
    ensureSmokeCustomer("seat-smoke-a@example.com", "seat_smoke_a"),
    ensureSmokeCustomer("seat-smoke-b@example.com", "seat_smoke_b")
  ]);
  const { event, seat } = await findTargetSeat();

  await SeatLock.updateMany(
    { seatId: seat._id, status: SEAT_LOCK_STATUSES.ACTIVE },
    { status: SEAT_LOCK_STATUSES.RELEASED }
  );
  await Seat.updateOne({ _id: seat._id }, { status: SEAT_STATUSES.AVAILABLE });

  const users = [customerA._id, customerB._id];
  const attempts = Array.from({ length: ATTEMPT_COUNT }, (_, index) =>
    lockSeatsForUser(event._id.toString(), users[index % users.length].toString(), {
      seatIds: [seat._id.toString()]
    })
      .then((result) => ({ ok: true, result }))
      .catch((error) => ({ ok: false, error }))
  );

  const results = await Promise.all(attempts);
  const successes = results.filter((result) => result.ok && result.result.lockedSeats.length === 1);
  const expectedFailures = results.filter((result) => !result.ok && isExpectedConflict(result.error));
  const unexpectedFailures = results.filter((result) => !result.ok && !isExpectedConflict(result.error));
  const finalSeat = await Seat.findById(seat._id).lean();
  const activeLockCount = await SeatLock.countDocuments({ seatId: seat._id, status: SEAT_LOCK_STATUSES.ACTIVE });
  const ownerUserId = successes[0]?.result?.lockedSeats?.[0]?.userId;
  const nonOwnerUserId = users.map((userId) => userId.toString()).find((userId) => userId !== ownerUserId);
  const ownerLocks = ownerUserId ? await getMyActiveSeatLocks(event._id.toString(), ownerUserId) : { items: [] };
  const nonOwnerLocks = nonOwnerUserId ? await getMyActiveSeatLocks(event._id.toString(), nonOwnerUserId) : { items: [] };
  const publicSeatMap = await getPublicSeatMap(event._id.toString());
  const seatMapSeat = publicSeatMap.sections
    .flatMap((section) => section.seats)
    .find((mappedSeat) => mappedSeat.id === seat._id.toString());
  const ownerSeesOwnLock = ownerLocks.items.some((lock) => lock.seatId === seat._id.toString());
  const nonOwnerSeesNoLock = !nonOwnerLocks.items.some((lock) => lock.seatId === seat._id.toString());

  console.log("Seat lock race smoke result");
  console.log(`Event: ${event._id}`);
  console.log(`Seat: ${seat._id}`);
  console.log(`Attempts: ${ATTEMPT_COUNT}`);
  console.log(`Successful locks: ${successes.length}`);
  console.log(`Expected conflicts: ${expectedFailures.length}`);
  console.log(`Unexpected failures: ${unexpectedFailures.length}`);
  console.log(`Final seat status: ${finalSeat?.status}`);
  console.log(`Active locks for seat: ${activeLockCount}`);
  console.log(`Owner sees active lock: ${ownerSeesOwnLock}`);
  console.log(`Non-owner sees active lock: ${!nonOwnerSeesNoLock}`);
  console.log(`Seat-map seat status: ${seatMapSeat?.status}`);

  if (
    successes.length !== 1 ||
    expectedFailures.length !== ATTEMPT_COUNT - 1 ||
    unexpectedFailures.length !== 0 ||
    finalSeat?.status !== SEAT_STATUSES.LOCKED ||
    activeLockCount !== 1 ||
    !ownerSeesOwnLock ||
    !nonOwnerSeesNoLock ||
    seatMapSeat?.status !== SEAT_STATUSES.LOCKED
  ) {
    throw new Error("Seat lock race smoke failed.");
  }

  console.log("PASS: exactly one concurrent lock succeeded, ownership is scoped, and the public seat map remains Locked.");
}

runSmoke()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("FAIL:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  });
