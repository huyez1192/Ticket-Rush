import { axiosClient, unwrapData } from "./axiosClient";

export async function getEvents(params = {}) {
  const response = await axiosClient.get("/events", { params });
  return unwrapData(response);
}

export async function getEventById(eventId) {
  const response = await axiosClient.get(`/events/${eventId}`);
  return unwrapData(response);
}

export async function getEventImages(eventId, params = {}) {
  const response = await axiosClient.get(`/events/${eventId}/images`, { params });
  return unwrapData(response);
}

export async function getEventSections(eventId, params = {}) {
  const response = await axiosClient.get(`/events/${eventId}/sections`, { params });
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
