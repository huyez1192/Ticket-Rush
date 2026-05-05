import { Router } from "express";
import { sendSuccess } from "../common/responses/apiResponse.js";
import { env } from "../config/env.js";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  sendSuccess(res, 200, "Ticket Rush API is running.", {
    service: "ticket-rush-api",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
