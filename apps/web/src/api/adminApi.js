import { axiosClient, unwrapData } from "./axiosClient";

export async function getDashboardOverview() {
  const response = await axiosClient.get("/admin/dashboard/overview");
  return unwrapData(response);
}
