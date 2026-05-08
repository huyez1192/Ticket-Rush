import mongoose from "mongoose";
import { ORDER_STATUS_VALUES, ORDER_STATUSES } from "../../common/constants/index.js";

const orderSchema = new mongoose.Schema(
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
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      required: true,
      default: ORDER_STATUSES.PENDING
    }
  },
  {
    collection: "orders",
    timestamps: true
  }
);

orderSchema.index({ userId: 1 }, { name: "idx_orders_user_id" });
orderSchema.index({ eventId: 1 }, { name: "idx_orders_event_id" });
orderSchema.index({ status: 1 }, { name: "idx_orders_status" });
orderSchema.index({ eventId: 1, status: 1 }, { name: "idx_orders_event_status" });

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true
    },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      required: true,
      default: ORDER_STATUSES.PENDING
    },
    priceSnapshot: {
      type: Number,
      required: true,
      min: 0.01
    }
  },
  {
    collection: "order_items",
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

orderItemSchema.index({ orderId: 1 }, { name: "idx_order_items_order_id" });
orderItemSchema.index({ seatId: 1 }, { name: "idx_order_items_seat_id" });
orderItemSchema.index(
  { seatId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: [ORDER_STATUSES.PENDING, ORDER_STATUSES.PAID] } },
    name: "uq_order_items_active_seat"
  }
);
orderItemSchema.index({ orderId: 1, seatId: 1 }, { unique: true, name: "uq_order_items_order_seat" });

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const OrderItem = mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);
