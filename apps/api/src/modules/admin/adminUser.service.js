import { ROLES } from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import { mapPagination } from "../bookings/order.mapper.js";
import { tryCreateAuditLog } from "./auditLog.repository.js";
import { mapUserToDto } from "./adminUser.mapper.js";
import {
  countBlockingOrderItemsByUserId,
  countOrdersByUserId,
  countTicketsByUserId,
  countUsersByRoleId,
  deleteUserById,
  findAdminUserById,
  findAdminUsers,
  findRoleByNameOrId,
  findRolesByIds,
  updateUserRolesById
} from "./adminUser.repository.js";

function getRoleNames(user) {
  return Array.isArray(user?.roles) ? user.roles.map((role) => role?.name).filter(Boolean) : [];
}

function getRoleIds(user) {
  return Array.isArray(user?.roles) ? user.roles.map((role) => role?._id?.toString?.() || role?.toString?.()) : [];
}

async function resolveRoleFilter(role) {
  if (!role) {
    return undefined;
  }

  const roleDocument = await findRoleByNameOrId(role);

  if (!roleDocument) {
    return null;
  }

  return roleDocument._id;
}

async function ensureRolesExist(roleIds) {
  const uniqueRoleIds = [...new Set(roleIds)];
  const roles = await findRolesByIds(uniqueRoleIds);

  if (roles.length !== uniqueRoleIds.length) {
    throw new AppError("One or more roles were not found.", 404);
  }

  return roles;
}

async function assertAdminRoleRemovalIsSafe(targetUser, newRoles, actorUserId) {
  const currentRoleNames = getRoleNames(targetUser);
  const newRoleNames = newRoles.map((role) => role.name);
  const isCurrentlyAdmin = currentRoleNames.includes(ROLES.ADMIN);
  const keepsAdmin = newRoleNames.includes(ROLES.ADMIN);

  if (targetUser._id.toString() === actorUserId && !keepsAdmin) {
    throw new AppError("Admins cannot remove their own Admin role.", 409);
  }

  if (isCurrentlyAdmin && !keepsAdmin) {
    const adminRole = currentRoleNames.includes(ROLES.ADMIN)
      ? targetUser.roles.find((role) => role.name === ROLES.ADMIN)
      : null;

    if (adminRole) {
      const adminCount = await countUsersByRoleId(adminRole._id);

      if (adminCount <= 1) {
        throw new AppError("Cannot remove the last Admin role.", 409);
      }
    }
  }
}

export async function listAdminUsers(query) {
  const roleId = await resolveRoleFilter(query.role);
  const pagination = {
    page: query.page,
    limit: query.limit
  };

  if (query.role && roleId === null) {
    return {
      items: [],
      pagination: mapPagination({ ...pagination, total: 0 })
    };
  }

  const { items, total } = await findAdminUsers({ ...query, roleId }, pagination);

  return {
    items: items.map((user) => mapUserToDto(user)).filter(Boolean),
    pagination: mapPagination({ ...pagination, total })
  };
}

export async function getAdminUser(userId) {
  const user = await findAdminUserById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return mapUserToDto(user);
}

export async function deleteAdminUser(userId, actorUserId) {
  if (userId === actorUserId) {
    throw new AppError("Admins cannot delete their own account.", 409);
  }

  const user = await findAdminUserById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const roleNames = getRoleNames(user);

  if (roleNames.includes(ROLES.ADMIN)) {
    const adminRole = user.roles.find((role) => role.name === ROLES.ADMIN);
    const adminCount = adminRole ? await countUsersByRoleId(adminRole._id) : 0;

    if (adminCount <= 1) {
      throw new AppError("Cannot delete the last Admin account.", 409);
    }
  }

  const [ordersCount, ticketsCount, orderItemsCount] = await Promise.all([
    countOrdersByUserId(userId),
    countTicketsByUserId(userId),
    countBlockingOrderItemsByUserId(userId)
  ]);

  if (ordersCount > 0 || ticketsCount > 0 || orderItemsCount > 0) {
    throw new AppError("Cannot delete a user with existing orders or tickets.", 409);
  }

  await deleteUserById(userId);
  await tryCreateAuditLog({
    userId: actorUserId,
    action: "ADMIN_DELETED_USER",
    entityType: "User",
    entityId: userId,
    metadata: {
      deletedUser: mapUserToDto(user)
    }
  });
}

export async function assignAdminUserRoles(userId, actorUserId, body) {
  const user = await findAdminUserById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const roleIds = [...new Set(body.roleIds)];
  const roles = await ensureRolesExist(roleIds);

  await assertAdminRoleRemovalIsSafe(user, roles, actorUserId);

  const updatedUser = await updateUserRolesById(userId, roleIds);

  await tryCreateAuditLog({
    userId: actorUserId,
    action: "ADMIN_UPDATED_USER_ROLES",
    entityType: "User",
    entityId: userId,
    metadata: {
      beforeRoleIds: getRoleIds(user),
      afterRoleIds: roleIds
    }
  });

  return mapUserToDto(updatedUser);
}

