import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import eventRoutes from "../modules/events/event.routes.js";
import orderRoutes from "../modules/bookings/order.routes.js";
import seatRoutes from "../modules/seats/seat.routes.js";
import seatLockRoutes from "../modules/seats/seatLock.routes.js";
import ticketRoutes from "../modules/tickets/ticket.routes.js";
import waitingQueueRoutes from "../modules/waiting-queue/waitingQueue.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ticket-rush-api",
    timestamp: new Date().toISOString()
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use(seatLockRoutes);
router.use(orderRoutes);
router.use(ticketRoutes);
router.use(waitingQueueRoutes);
router.use("/events", seatRoutes);
router.use("/events", eventRoutes);

export default router;
