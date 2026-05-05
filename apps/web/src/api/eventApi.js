import { axiosClient, unwrapData } from "./axiosClient";

export async function getEvents(params = {}) {
  const response = await axiosClient.get("/events", { params });
  return unwrapData(response);
}
