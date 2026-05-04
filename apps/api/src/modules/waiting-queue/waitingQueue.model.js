import mongoose from "mongoose";
import { QUEUE_STATUS_VALUES, QUEUE_STATUSES } from "../../common/constants/index.js";

const waitingQueueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    position: {
      type: Number,
      required: true,
      min: 1
    },
    token: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    status: {
      type: String,
      enum: QUEUE_STATUS_VALUES,
      required: true,
      default: QUEUE_STATUSES.WAITING
    },
    admittedAt: {
      type: Date
    },
    expiredAt: {
      type: Date
    }
  },
  {
    collection: "waiting_queue",
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

waitingQueueSchema.index({ eventId: 1 }, { name: "idx_waiting_queue_event_id" });
waitingQueueSchema.index({ status: 1 }, { name: "idx_waiting_queue_status" });
waitingQueueSchema.index({ eventId: 1, status: 1, position: 1 }, { name: "idx_waiting_queue_event_status_position" });
waitingQueueSchema.index({ userId: 1, eventId: 1 }, { unique: true, name: "uq_waiting_queue_user_event" });

export const WaitingQueueEntry =
  mongoose.models.WaitingQueueEntry || mongoose.model("WaitingQueueEntry", waitingQueueSchema);
