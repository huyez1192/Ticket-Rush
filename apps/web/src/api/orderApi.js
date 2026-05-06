import { axiosClient, unwrapData } from "./axiosClient";

export async function getMyOrders(params = {}) {
  const response = await axiosClient.get("/orders", { params });
  return unwrapData(response);
}

export async function createOrder(payload) {
  const response = await axiosClient.post("/orders", payload);
  return unwrapData(response);
}

export async function getOrderById(orderId) {
  const response = await axiosClient.get(`/orders/${orderId}`);
  return unwrapData(response);
}

export async function cancelOrder(orderId) {
  const response = await axiosClient.delete(`/orders/${orderId}`);
  return unwrapData(response);
}

export async function checkoutOrder(orderId, payload = { confirm: true }) {
  const response = await axiosClient.post(`/orders/${orderId}/checkout`, payload);
  return unwrapData(response);
}
