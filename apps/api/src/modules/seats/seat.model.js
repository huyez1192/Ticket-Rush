import mongoose from "mongoose";
import { SEAT_STATUS_VALUES, SEAT_STATUSES } from "../../common/constants/index.js";

const finiteNumberValidator = {
  validator(value) {
    return value === undefined || value === null || Number.isFinite(value);
  },
  message: "Layout number fields must be finite."
};

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
    },
    layout: {
      x: {
        type: Number,
        validate: finiteNumberValidator
      },
      y: {
        type: Number,
        validate: finiteNumberValidator
      },
      rotation: {
        type: Number,
        default: 0,
        validate: finiteNumberValidator
      },
      width: {
        type: Number,
        min: 0.01,
        validate: finiteNumberValidator
      },
      height: {
        type: Number,
        min: 0.01,
        validate: finiteNumberValidator
      },
      label: {
        type: String,
        trim: true,
        maxlength: 80
      },
      rowLabel: {
        type: String,
        trim: true,
        maxlength: 40
      },
      isPlaced: {
        type: Boolean
      }
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
