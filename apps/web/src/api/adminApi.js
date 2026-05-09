import { axiosClient, unwrapData } from "./axiosClient";

export async function getDashboardOverview() {
  const response = await axiosClient.get("/admin/dashboard/overview");
  return unwrapData(response);
}

export async function getEventRevenue(eventId, params = {}) {
  const response = await axiosClient.get(`/admin/dashboard/events/${eventId}/revenue`, { params });
  return unwrapData(response);
}

export async function getEventSeatOccupancy(eventId) {
  const response = await axiosClient.get(`/admin/dashboard/events/${eventId}/seat-occupancy`);
  return unwrapData(response);
}

export async function getEventDemographics(eventId) {
  const response = await axiosClient.get(`/admin/dashboard/events/${eventId}/demographics`);
  return unwrapData(response);
}

export async function getAdminEvents(params = {}) {
  const response = await axiosClient.get("/events", { params });
  return unwrapData(response);
}

export async function getAdminEventById(eventId) {
  const response = await axiosClient.get(`/events/${eventId}`);
  return unwrapData(response);
}

export async function createEvent(payload) {
  const response = await axiosClient.post("/events", payload);
  return unwrapData(response);
}

export async function updateEvent(eventId, payload) {
  const response = await axiosClient.put(`/events/${eventId}`, payload);
  return unwrapData(response);
}

export async function deleteEvent(eventId) {
  const response = await axiosClient.delete(`/events/${eventId}`);
  return unwrapData(response);
}

export async function publishEvent(eventId) {
  const response = await axiosClient.post(`/events/${eventId}/publish`);
  return unwrapData(response);
}

export async function openSellingEvent(eventId) {
  const response = await axiosClient.post(`/events/${eventId}/open-selling`);
  return unwrapData(response);
}

export async function closeEvent(eventId) {
  const response = await axiosClient.post(`/events/${eventId}/close`);
  return unwrapData(response);
}

export async function cancelEvent(eventId) {
  const response = await axiosClient.post(`/events/${eventId}/cancel`);
  return unwrapData(response);
}

export async function getEventImages(eventId) {
  const response = await axiosClient.get(`/events/${eventId}/images`);
  return unwrapData(response);
}

export async function createEventImage(eventId, payload) {
  const response = await axiosClient.post(`/events/${eventId}/images`, payload);
  return unwrapData(response);
}

export async function deleteEventImage(eventId, imageId) {
  const response = await axiosClient.delete(`/events/${eventId}/images/${imageId}`);
  return unwrapData(response);
}

export async function getEventSections(eventId) {
  const response = await axiosClient.get(`/events/${eventId}/sections`);
  return unwrapData(response);
}

export async function getEventSectionById(eventId, sectionId) {
  const response = await axiosClient.get(`/events/${eventId}/sections/${sectionId}`);
  return unwrapData(response);
}

export async function createEventSection(eventId, payload) {
  const response = await axiosClient.post(`/events/${eventId}/sections`, payload);
  return unwrapData(response);
}

export async function updateEventSection(eventId, sectionId, payload) {
  const response = await axiosClient.put(`/events/${eventId}/sections/${sectionId}`, payload);
  return unwrapData(response);
}

export async function deleteEventSection(eventId, sectionId) {
  const response = await axiosClient.delete(`/events/${eventId}/sections/${sectionId}`);
  return unwrapData(response);
}

export async function generateSeats(eventId, sectionId, payload) {
  const response = await axiosClient.post(`/events/${eventId}/sections/${sectionId}/generate-seats`, payload);
  return unwrapData(response);
}

export async function getEventSeats(eventId, params = {}) {
  const response = await axiosClient.get(`/events/${eventId}/seats`, { params });
  return unwrapData(response);
}

export async function getEventSeatMap(eventId) {
  const response = await axiosClient.get(`/events/${eventId}/seat-map`);
  return unwrapData(response);
}

export async function updateSeatMapLayout(eventId, payload) {
  const response = await axiosClient.put(`/events/${eventId}/seat-map/layout`, payload);
  return unwrapData(response);
}

export async function updateSeatMapStage(eventId, payload) {
  const response = await axiosClient.patch(`/events/${eventId}/seat-map/stage`, payload);
  return unwrapData(response);
}

export async function updateSeatLayout(eventId, seatId, payload) {
  const response = await axiosClient.patch(`/events/${eventId}/seats/${seatId}/layout`, payload);
  return unwrapData(response);
}

export async function bulkUpdateSeatLayouts(eventId, payload) {
  const response = await axiosClient.patch(`/events/${eventId}/seats/layout/bulk`, payload);
  return unwrapData(response);
}

export async function updateSeatStatus(eventId, seatId, payload) {
  const response = await axiosClient.patch(`/events/${eventId}/seats/${seatId}`, payload);
  return unwrapData(response);
}

export async function getAdminOrders(params = {}) {
  const response = await axiosClient.get("/admin/orders", { params });
  return unwrapData(response);
}

export async function getAdminOrderById(orderId) {
  const response = await axiosClient.get(`/admin/orders/${orderId}`);
  return unwrapData(response);
}

export async function verifyTicket(payload) {
  const response = await axiosClient.post("/admin/tickets/verify", payload);
  return unwrapData(response);
}

export async function getAdminUsers(params = {}) {
  const response = await axiosClient.get("/admin/users", { params });
  return unwrapData(response);
}

export async function getAdminUserById(userId) {
  const response = await axiosClient.get(`/admin/users/${userId}`);
  return unwrapData(response);
}

export async function deleteAdminUser(userId) {
  const response = await axiosClient.delete(`/admin/users/${userId}`);
  return unwrapData(response);
}

export async function assignAdminUserRoles(userId, payload) {
  const response = await axiosClient.put(`/admin/users/${userId}/roles`, payload);
  return unwrapData(response);
}

export async function getAdminRoles(params = {}) {
  const response = await axiosClient.get("/admin/roles", { params });
  return unwrapData(response);
}

export async function getAdminEventQueue(eventId, params = {}) {
  const response = await axiosClient.get(`/admin/events/${eventId}/queue`, { params });
  return unwrapData(response);
}

export async function admitQueueBatch(eventId, payload = {}) {
  const response = await axiosClient.post(`/admin/events/${eventId}/queue/admit-batch`, payload);
  return unwrapData(response);
}

export async function updateEventQueueConfig(eventId, payload) {
  const response = await axiosClient.patch(`/admin/events/${eventId}/queue/config`, payload);
  return unwrapData(response);
}
