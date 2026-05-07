import mongoose from "mongoose";

const finiteNumberValidator = {
  validator(value) {
    return value === undefined || value === null || Number.isFinite(value);
  },
  message: "Visual number fields must be finite."
};

const seatSectionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0.01
    },
    color: {
      type: String,
      trim: true,
      maxlength: 32
    },
    displayOrder: {
      type: Number,
      validate: finiteNumberValidator
    },
    defaultSeatWidth: {
      type: Number,
      min: 0.01,
      validate: finiteNumberValidator
    },
    defaultSeatHeight: {
      type: Number,
      min: 0.01,
      validate: finiteNumberValidator
    }
  },
  {
    collection: "seat_sections",
    timestamps: true
  }
);

seatSectionSchema.index({ eventId: 1 }, { name: "idx_seat_sections_event_id" });
seatSectionSchema.index({ eventId: 1, name: 1 }, { unique: true, name: "uq_seat_sections_event_name" });

export const SeatSection = mongoose.models.SeatSection || mongoose.model("SeatSection", seatSectionSchema);
