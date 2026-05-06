import { axiosClient, unwrapData } from "./axiosClient";

export async function createSeatLocks(eventId, seatIds, queueToken) {
  const payload = { seatIds };

  if (queueToken) {
    payload.queueToken = queueToken;
  }

  const response = await axiosClient.post(`/events/${eventId}/seat-locks`, payload);
  return unwrapData(response);
}

export async function getMySeatLocks(eventId) {
  const response = await axiosClient.get(`/events/${eventId}/seat-locks`);
  return unwrapData(response);
}

export async function releaseSeatLock(eventId, seatId) {
  const response = await axiosClient.delete(`/events/${eventId}/seat-locks/${seatId}`);
  return unwrapData(response);
}
