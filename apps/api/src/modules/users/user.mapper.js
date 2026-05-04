function toPlainObject(document) {
  if (!document) {
    return null;
  }

  return typeof document.toObject === "function" ? document.toObject() : document;
}

export function mapRoleToDto(role) {
  const value = toPlainObject(role);

  if (!value) {
    return null;
  }

  return {
    id: value._id?.toString(),
    name: value.name
  };
}

export function mapUserToDto(user) {
  const value = toPlainObject(user);

  if (!value) {
    return null;
  }

  return {
    id: value._id?.toString(),
    username: value.username,
    email: value.email,
    fullName: value.fullName,
    dateOfBirth: value.dateOfBirth,
    gender: value.gender,
    roles: Array.isArray(value.roles) ? value.roles.map((role) => mapRoleToDto(role) || role?.toString()) : [],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}
