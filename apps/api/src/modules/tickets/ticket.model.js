import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
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
    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true
    },
    qrCode: {
      type: String,
      required: true,
      trim: true
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    collection: "tickets",
    timestamps: false
  }
);

ticketSchema.index({ orderItemId: 1 }, { unique: true, name: "idx_tickets_order_item_id_unique" });
ticketSchema.index({ qrCode: 1 }, { unique: true, name: "idx_tickets_qr_code_unique" });
ticketSchema.index({ userId: 1 }, { name: "idx_tickets_user_id" });
ticketSchema.index({ eventId: 1 }, { name: "idx_tickets_event_id" });
ticketSchema.index({ seatId: 1 }, { name: "idx_tickets_seat_id" });

export const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
