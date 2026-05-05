import { AppError } from "../../common/errors/AppError.js";
import { mapPagination } from "../bookings/order.mapper.js";
import { mapRoleToDto } from "./adminRole.mapper.js";
import { findRoleById, findRoles } from "./adminRole.repository.js";

export async function listAdminRoles() {
  const roles = await findRoles();
  const total = roles.length;

  return {
    items: roles.map((role) => mapRoleToDto(role)).filter(Boolean),
    pagination: mapPagination({ page: 1, limit: total || 20, total })
  };
}

export async function getAdminRole(roleId) {
  const role = await findRoleById(roleId);

  if (!role) {
    throw new AppError("Role not found.", 404);
  }

  return mapRoleToDto(role);
}

