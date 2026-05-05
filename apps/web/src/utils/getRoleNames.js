export function getRoleNames(userOrRoles) {
  const roles = Array.isArray(userOrRoles) ? userOrRoles : userOrRoles?.roles;

  if (!Array.isArray(roles)) {
    if (typeof userOrRoles?.role === "string") {
      return [userOrRoles.role];
    }
    return [];
  }

  return roles
    .map((role) => {
      if (typeof role === "string") {
        return role;
      }
      return role?.name || role?.role || role?.title;
    })
    .filter(Boolean);
}
