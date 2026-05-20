import { axiosClient, unwrapData } from "./axiosClient";

export async function getMyProfile() {
  const response = await axiosClient.get("/users/me");
  return unwrapData(response);
}

export async function updateMyProfile(payload) {
  const response = await axiosClient.put("/users/me", payload);
  return unwrapData(response);
}

export async function uploadMyAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await axiosClient.post("/users/me/avatar", formData);
  return unwrapData(response);
}

export async function changeMyPassword(payload) {
  const response = await axiosClient.put("/users/me/password", payload);
  return unwrapData(response);
}
