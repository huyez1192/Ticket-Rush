import { axiosClient, unwrapData } from "./axiosClient";

export async function getMyTickets(params = {}) {
  const response = await axiosClient.get("/tickets", { params });
  return unwrapData(response);
}

export async function getTicketById(ticketId) {
  const response = await axiosClient.get(`/tickets/${ticketId}`);
  return unwrapData(response);
}

export async function getTicketQr(ticketId) {
  const response = await axiosClient.get(`/tickets/${ticketId}/qr`);
  return unwrapData(response);
}
