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

export async function authenticate(req, _res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      throw new AppError("Authentication token is required.", 401);
    }

    let decoded;

    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (_error) {
      throw new AppError("Invalid or expired authentication token.", 401);
    }

    const userId = decoded.sub || decoded.id;

    if (!userId) {
      throw new AppError("Invalid or expired authentication token.", 401);
    }

    const user = await findUserById(userId);

    if (!user) {
      throw new AppError("Authenticated user no longer exists.", 401);
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      roles: getRoleNames(user),
      document: user
    };

    next();
  } catch (error) {
    next(error);
  }
}
