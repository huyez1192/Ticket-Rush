import { sendNoContent, sendSuccess } from "../../common/responses/apiResponse.js";
import {
  cancelMyPendingOrder,
  checkoutMyOrder,
  createPendingOrder,
  getAdminOrder,
  getMyOrder,
  listAdminOrders,
  listMyOrders
} from "./order.service.js";

export async function listOrders(req, res, next) {
  try {
    const data = await listMyOrders(req.user.id, req.query);
    sendSuccess(res, 200, "Orders fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  try {
    const data = await createPendingOrder(req.user.id, req.body);
    sendSuccess(res, 200, "Order created successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req, res, next) {
  try {
    const data = await getMyOrder(req.params.orderId, req.user.id);
    sendSuccess(res, 200, "Order fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    await cancelMyPendingOrder(req.params.orderId, req.user.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function checkoutOrder(req, res, next) {
  try {
    const data = await checkoutMyOrder(req.params.orderId, req.user.id, req.body);
    sendSuccess(res, 200, "Checkout completed successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function adminListOrders(req, res, next) {
  try {
    const data = await listAdminOrders(req.query);
    sendSuccess(res, 200, "Admin orders fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function adminGetOrder(req, res, next) {
  try {
    const data = await getAdminOrder(req.params.orderId);
    sendSuccess(res, 200, "Admin order fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}
