import { axiosClient, unwrapData } from "./axiosClient";

export async function joinEventQueue(eventId) {
  const response = await axiosClient.post(`/events/${eventId}/queue/join`, {});
  return unwrapData(response);
}

export async function getMyEventQueue(eventId) {
  const response = await axiosClient.get(`/events/${eventId}/queue/me`);
  return unwrapData(response);
}

export async function leaveEventQueue(eventId) {
  const response = await axiosClient.delete(`/events/${eventId}/queue/me`);
  return unwrapData(response);
}
