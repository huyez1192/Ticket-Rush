import axios from "axios";
import { getStoredToken } from "../features/auth/authStorage";
import { mapApiError } from "../utils/mapApiError";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(mapApiError(error)),
);

export function unwrapData(response) {
  return response?.data?.data ?? response?.data;
}
