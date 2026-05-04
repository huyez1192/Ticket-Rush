import mongoose from "mongoose";
import { SEAT_LOCK_STATUS_VALUES, SEAT_LOCK_STATUSES } from "../../common/constants/index.js";

const seatLockSchema = new mongoose.Schema(
  {
    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lockedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return !this.lockedAt || value > this.lockedAt;
        },
        message: "Seat lock expiresAt must be after lockedAt."
      }
    },
    status: {
      type: String,
      enum: SEAT_LOCK_STATUS_VALUES,
      required: true,
      default: SEAT_LOCK_STATUSES.ACTIVE
    }
  },
  {
    collection: "seat_locks",
    timestamps: false
  }
);

seatLockSchema.index(
  { seatId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: SEAT_LOCK_STATUSES.ACTIVE },
    name: "uq_active_seat_lock"
  }
);
seatLockSchema.index({ userId: 1 }, { name: "idx_seat_locks_user_id" });
seatLockSchema.index({ status: 1 }, { name: "idx_seat_locks_status" });
seatLockSchema.index({ expiresAt: 1 }, { name: "idx_seat_locks_expires_at" });
seatLockSchema.index(
  { expiresAt: 1 },
  {
    partialFilterExpression: { status: SEAT_LOCK_STATUSES.ACTIVE },
    name: "idx_seat_locks_active_expired"
  }
);

export const SeatLock = mongoose.models.SeatLock || mongoose.model("SeatLock", seatLockSchema);
