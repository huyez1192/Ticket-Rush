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

  if (!value.name) {
    return role?.toString();
  }

  return {
    id: value._id?.toString(),
    name: value.name
  };
}

function mapDateOnly(value) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString().slice(0, 10);
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
    dateOfBirth: mapDateOnly(value.dateOfBirth),
    gender: value.gender,
    roles: Array.isArray(value.roles) ? value.roles.map((role) => mapRoleToDto(role)).filter(Boolean) : [],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}
