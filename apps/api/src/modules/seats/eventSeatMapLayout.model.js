import mongoose from "mongoose";

const finiteNumberValidator = {
  validator(value) {
    return value === undefined || value === null || Number.isFinite(value);
  },
  message: "Layout number fields must be finite."
};

const stageSchema = new mongoose.Schema(
  {
    x: { type: Number, validate: finiteNumberValidator },
    y: { type: Number, validate: finiteNumberValidator },
    width: { type: Number, min: 0.01, validate: finiteNumberValidator },
    height: { type: Number, min: 0.01, validate: finiteNumberValidator },
    label: { type: String, trim: true, maxlength: 80 }
  },
  { _id: false }
);

const viewportSchema = new mongoose.Schema(
  {
    x: { type: Number, validate: finiteNumberValidator },
    y: { type: Number, validate: finiteNumberValidator },
    zoom: { type: Number, min: 0.01, validate: finiteNumberValidator }
  },
  { _id: false }
);

const eventSeatMapLayoutSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    canvasWidth: {
      type: Number,
      min: 0.01,
      validate: finiteNumberValidator
    },
    canvasHeight: {
      type: Number,
      min: 0.01,
      validate: finiteNumberValidator
    },
    gridSize: {
      type: Number,
      min: 0.01,
      validate: finiteNumberValidator
    },
    stage: {
      type: stageSchema,
      default: undefined
    },
    defaultZoom: {
      type: Number,
      min: 0.01,
      validate: finiteNumberValidator
    },
    viewport: {
      type: viewportSchema,
      default: undefined
    },
    version: {
      type: Number,
      default: 1,
      min: 1
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    collection: "event_seat_map_layouts",
    timestamps: true
  }
);

eventSeatMapLayoutSchema.index({ eventId: 1 }, { unique: true, name: "uq_event_seat_map_layout_event_id" });

export const EventSeatMapLayout =
  mongoose.models.EventSeatMapLayout || mongoose.model("EventSeatMapLayout", eventSeatMapLayoutSchema);
