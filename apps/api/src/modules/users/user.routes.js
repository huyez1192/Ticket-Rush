import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { changePassword, getMe, updateMe } from "./user.controller.js";
import { changePasswordSchema, updateProfileSchema } from "./user.validation.js";

const router = Router();

router.get("/me", authenticate, getMe);
router.put("/me", authenticate, validate(updateProfileSchema), updateMe);
router.put("/me/password", authenticate, validate(changePasswordSchema), changePassword);

export default router;
