import { axiosClient, unwrapData } from "./axiosClient";

export async function login(credentials) {
  const response = await axiosClient.post("/auth/login", credentials);
  return unwrapData(response);
}

export async function register(payload) {
  const response = await axiosClient.post("/auth/register", payload);
  return unwrapData(response);
}

export async function getMe() {
  const response = await axiosClient.get("/auth/me");
  return unwrapData(response);
}

export async function logout() {
  const response = await axiosClient.post("/auth/logout");
  return unwrapData(response);
}
