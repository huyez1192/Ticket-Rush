import { Router } from "express";
import { ROLES } from "../../common/constants/index.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  adminGetOrder,
  adminListOrders,
  cancelOrder,
  checkoutOrder,
  createOrder,
  getOrder,
  listOrders
} from "./order.controller.js";
import {
  adminListOrdersSchema,
  checkoutSchema,
  createOrderSchema,
  listOrdersSchema,
  orderIdParamsSchema
} from "./order.validation.js";

const router = Router();

router.get("/orders", authenticate, requireRole(ROLES.CUSTOMER), validate(listOrdersSchema), listOrders);
router.post("/orders", authenticate, requireRole(ROLES.CUSTOMER), validate(createOrderSchema), createOrder);
router.get("/orders/:orderId", authenticate, requireRole(ROLES.CUSTOMER), validate(orderIdParamsSchema), getOrder);
router.delete("/orders/:orderId", authenticate, requireRole(ROLES.CUSTOMER), validate(orderIdParamsSchema), cancelOrder);
router.post("/orders/:orderId/checkout", authenticate, requireRole(ROLES.CUSTOMER), validate(checkoutSchema), checkoutOrder);
router.get("/admin/orders", authenticate, requireRole(ROLES.ADMIN), validate(adminListOrdersSchema), adminListOrders);
router.get("/admin/orders/:orderId", authenticate, requireRole(ROLES.ADMIN), validate(orderIdParamsSchema), adminGetOrder);

export default router;
