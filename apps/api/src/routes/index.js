import { Router } from "express";
import { sendSuccess } from "../common/responses/apiResponse.js";
import { env } from "../config/env.js";

const router = Router();

router.get("/health", (_req, res) => {
  sendSuccess(res, 200, "Ticket Rush API is running.", {
    service: "ticket-rush-api",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

export default router;
