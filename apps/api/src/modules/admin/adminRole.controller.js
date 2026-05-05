import { sendSuccess } from "../../common/responses/apiResponse.js";
import { getAdminRole, listAdminRoles } from "./adminRole.service.js";

export async function adminListRoles(_req, res, next) {
  try {
    const data = await listAdminRoles();
    sendSuccess(res, 200, "Roles fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function adminGetRole(req, res, next) {
  try {
    const data = await getAdminRole(req.params.id);
    sendSuccess(res, 200, "Role fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

