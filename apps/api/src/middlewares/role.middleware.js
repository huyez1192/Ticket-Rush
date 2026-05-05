import { AppError } from "../common/errors/AppError.js";

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError("Authentication is required.", 401));
      return;
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
    const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasAllowedRole) {
      next(new AppError("You do not have permission to access this resource.", 403));
      return;
    }

    next();
  };
}

export const requireRoles = requireRole;
