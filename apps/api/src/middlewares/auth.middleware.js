import jwt from "jsonwebtoken";
import { AppError } from "../common/errors/AppError.js";
import { env } from "../config/env.js";
import { findUserById } from "../modules/users/user.repository.js";

function getBearerToken(req) {
  const header = req.get("authorization");

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function getRoleNames(user) {
  return Array.isArray(user.roles)
    ? user.roles.map((role) => role?.name || role).filter(Boolean)
    : [];
}

async function resolveUserFromToken(token) {
  let decoded;

  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (_error) {
    return null;
  }

  const userId = decoded.sub || decoded.id;

  if (!userId) {
    return null;
  }

  const user = await findUserById(userId);

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    roles: getRoleNames(user),
    document: user
  };
}

export async function authenticate(req, _res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      throw new AppError("Authentication token is required.", 401);
    }

    const user = await resolveUserFromToken(token);

    if (!user) {
      throw new AppError("Invalid or expired authentication token.", 401);
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(req, _res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      next();
      return;
    }

    const user = await resolveUserFromToken(token);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    next(error);
  }
}
