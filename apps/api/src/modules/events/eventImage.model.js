import mongoose from "mongoose";

const eventImageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    collection: "event_images",
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

eventImageSchema.index({ eventId: 1 }, { name: "idx_event_images_event_id" });

export const EventImage = mongoose.models.EventImage || mongoose.model("EventImage", eventImageSchema);
