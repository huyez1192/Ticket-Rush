import { sendNoContent, sendSuccess } from "../../common/responses/apiResponse.js";
import { assignAdminUserRoles, deleteAdminUser, getAdminUser, listAdminUsers } from "./adminUser.service.js";

export async function adminListUsers(req, res, next) {
  try {
    const data = await listAdminUsers(req.query);
    sendSuccess(res, 200, "Users fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function adminGetUser(req, res, next) {
  try {
    const data = await getAdminUser(req.params.id);
    sendSuccess(res, 200, "User fetched successfully.", data);
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteUser(req, res, next) {
  try {
    await deleteAdminUser(req.params.id, req.user.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function adminAssignUserRoles(req, res, next) {
  try {
    const data = await assignAdminUserRoles(req.params.id, req.user.id, req.body);
    sendSuccess(res, 200, "User roles updated successfully.", data);
  } catch (error) {
    next(error);
  }
}

