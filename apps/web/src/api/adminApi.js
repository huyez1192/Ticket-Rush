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
