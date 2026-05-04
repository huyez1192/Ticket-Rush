import mongoose from "mongoose";
import { SEAT_STATUS_VALUES, SEAT_STATUSES } from "../../common/constants/index.js";

const seatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeatSection",
      required: true
    },
    rowNumber: {
      type: Number,
      required: true,
      min: 1
    },
    seatNumber: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: SEAT_STATUS_VALUES,
      required: true,
      default: SEAT_STATUSES.AVAILABLE
    }
  },
  {
    collection: "seats",
    timestamps: true
  }
);

seatSchema.index({ sectionId: 1 }, { name: "idx_seats_section_id" });
seatSchema.index({ status: 1 }, { name: "idx_seats_status" });
seatSchema.index({ sectionId: 1, status: 1 }, { name: "idx_seats_section_status" });
seatSchema.index({ eventId: 1, status: 1 }, { name: "idx_seats_event_status" });
seatSchema.index(
  { sectionId: 1, rowNumber: 1, seatNumber: 1 },
  { unique: true, name: "uq_seats_position" }
);

export const Seat = mongoose.models.Seat || mongoose.model("Seat", seatSchema);
