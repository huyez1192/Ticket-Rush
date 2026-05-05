import bcrypt from "bcryptjs";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { mapUserToDto } from "./user.mapper.js";
import {
  findUserById,
  updateUserById,
  updateUserPasswordHash,
  usernameOrEmailExists
} from "./user.repository.js";

function normalizeProfilePayload(payload) {
  const update = { ...payload };

  if (payload.dateOfBirth) {
    update.dateOfBirth = new Date(`${payload.dateOfBirth}T00:00:00.000Z`);
  }

  return update;
}

export async function getMyProfile(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return mapUserToDto(user);
}

export async function updateMyProfile(userId, payload) {
  const duplicate = await usernameOrEmailExists({
    username: payload.username,
    email: payload.email,
    excludeUserId: userId
  });

  if (duplicate) {
    throw new AppError("Username or email already exists.", 409);
  }

  const user = await updateUserById(userId, normalizeProfilePayload(payload));

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return mapUserToDto(user);
}

export async function changeMyPassword(userId, payload) {
  const user = await findUserById(userId, {
    includePasswordHash: true,
    populateRoles: false
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const oldPasswordMatches = await bcrypt.compare(payload.oldPassword, user.passwordHash);

  if (!oldPasswordMatches) {
    throw new AppError("Old password is incorrect.", 400);
  }

  const passwordHash = await bcrypt.hash(payload.newPassword, env.BCRYPT_SALT_ROUNDS);
  await updateUserPasswordHash(userId, passwordHash);

  return {};
}
