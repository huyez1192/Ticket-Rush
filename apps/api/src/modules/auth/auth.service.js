import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ROLES } from "../../common/constants/index.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { mapAuthResponse } from "./auth.mapper.js";
import {
  createUser,
  findRoleByName,
  findUserById,
  findUserByUsernameOrEmail,
  usernameOrEmailExists
} from "./auth.repository.js";

function getRoleNames(user) {
  return Array.isArray(user.roles)
    ? user.roles.map((role) => role?.name || role).filter(Boolean)
    : [];
}

function signAccessToken(user) {
  const roles = getRoleNames(user);

  return jwt.sign(
    {
      sub: user._id.toString(),
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      roles
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

function normalizeRegisterPayload(payload) {
  return {
    username: payload.username,
    email: payload.email,
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth ? new Date(`${payload.dateOfBirth}T00:00:00.000Z`) : undefined,
    gender: payload.gender
  };
}

export async function registerCustomer(payload) {
  const existingUser = await usernameOrEmailExists({
    username: payload.username,
    email: payload.email
  });

  if (existingUser) {
    throw new AppError("Username or email already exists.", 409);
  }

  const customerRole = await findRoleByName(ROLES.CUSTOMER);

  if (!customerRole) {
    throw new AppError("Customer role is not configured.", 500);
  }

  const passwordHash = await bcrypt.hash(payload.password, env.BCRYPT_SALT_ROUNDS);

  const user = await createUser({
    ...normalizeRegisterPayload(payload),
    passwordHash,
    roles: [customerRole._id]
  });

  await user.populate({ path: "roles", select: "name" });

  return mapAuthResponse({
    accessToken: signAccessToken(user),
    user
  });
}

export async function loginUser(payload, options = {}) {
  const user = await findUserByUsernameOrEmail(payload.usernameOrEmail, {
    includePasswordHash: true
  });

  if (!user) {
    throw new AppError("Invalid username/email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid username/email or password.", 401);
  }

  const roleNames = getRoleNames(user);

  if (options.requiredRole && !roleNames.includes(options.requiredRole)) {
    throw new AppError("This account is not allowed to access this login endpoint.", 403);
  }

  return mapAuthResponse({
    accessToken: signAccessToken(user),
    user
  });
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("Authenticated user no longer exists.", 401);
  }

  return user;
}

export function logoutUser() {
  return {};
}
