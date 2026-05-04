import mongoose from "mongoose";
import { EVENT_STATUS_VALUES } from "../../common/constants/index.js";

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return !this.startTime || value > this.startTime;
        },
        message: "Event endTime must be after startTime."
      }
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: EVENT_STATUS_VALUES,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    collection: "events",
    timestamps: true
  }
);

eventSchema.index({ status: 1 }, { name: "idx_events_status" });
eventSchema.index({ startTime: 1 }, { name: "idx_events_start_time" });
eventSchema.index({ createdBy: 1 }, { name: "idx_events_created_by" });
eventSchema.index({ name: "text", description: "text" }, { name: "idx_events_text_search" });

export const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
