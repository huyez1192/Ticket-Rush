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
    sequenceNumber: {
      type: Number,
      required: true,
      min: 1
    },
    queueTokenHash: {
      type: String,
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
    },
    expiresAt: {
      type: Date
    }
  },
  {
    collection: "waiting_queue",
    timestamps: true
  }
);

waitingQueueSchema.index({ eventId: 1 }, { name: "idx_waiting_queue_event_id" });
waitingQueueSchema.index({ status: 1 }, { name: "idx_waiting_queue_status" });
waitingQueueSchema.index({ eventId: 1, status: 1, sequenceNumber: 1 }, { name: "idx_waiting_queue_event_status_sequence" });
waitingQueueSchema.index(
  { queueTokenHash: 1 },
  {
    unique: true,
    partialFilterExpression: { queueTokenHash: { $type: "string" } },
    name: "uq_waiting_queue_token_hash"
  }
);
waitingQueueSchema.index(
  { eventId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: [QUEUE_STATUSES.WAITING, QUEUE_STATUSES.ADMITTED] } },
    name: "uq_waiting_queue_active_user_event"
  }
);

export const WaitingQueueEntry =
  mongoose.models.WaitingQueueEntry || mongoose.model("WaitingQueueEntry", waitingQueueSchema);
