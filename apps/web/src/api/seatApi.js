import { axiosClient, unwrapData } from "./axiosClient";

export async function getEventSections(eventId) {
  const response = await axiosClient.get(`/events/${eventId}/sections`);
  return unwrapData(response);
}

export async function getEventSeatMap(eventId) {
  const response = await axiosClient.get(`/events/${eventId}/seat-map`);
  return unwrapData(response);
}

export async function getEventSeats(eventId, params = {}) {
  const response = await axiosClient.get(`/events/${eventId}/seats`, { params });
  return unwrapData(response);
}

export async function getSeatById(eventId, seatId) {
  const response = await axiosClient.get(`/events/${eventId}/seats/${seatId}`);
  return unwrapData(response);
}

export async function getSeatMapChanges(eventId, params = {}) {
  const response = await axiosClient.get(`/events/${eventId}/seat-map/changes`, { params });
  return unwrapData(response);
}
