import mongoose from "mongoose";
import { TICKET_STATUS_VALUES, TICKET_STATUSES } from "../../common/constants/index.js";

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
    status: {
      type: String,
      enum: TICKET_STATUS_VALUES,
      required: true,
      default: TICKET_STATUSES.ISSUED
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    checkedInAt: {
      type: Date,
      default: null
    },
    verifiedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
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
ticketSchema.index({ seatId: 1 }, { unique: true, name: "uq_tickets_seat_id" });
ticketSchema.index({ status: 1 }, { name: "idx_tickets_status" });

export const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
