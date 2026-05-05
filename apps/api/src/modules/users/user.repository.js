import { User } from "./user.model.js";

const USER_POPULATE_ROLES = { path: "roles", select: "name" };

export function findUserById(id, options = {}) {
  const query = User.findById(id);

  if (options.includePasswordHash) {
    query.select("+passwordHash");
  }

  if (options.populateRoles !== false) {
    query.populate(USER_POPULATE_ROLES);
  }

  return query;
}

export function findUserByUsername(username, options = {}) {
  const query = User.findOne({ username });

  if (options.includePasswordHash) {
    query.select("+passwordHash");
  }

  if (options.populateRoles !== false) {
    query.populate(USER_POPULATE_ROLES);
  }

  return query;
}

export function findUserByEmail(email, options = {}) {
  const query = User.findOne({ email: email.toLowerCase() });

  if (options.includePasswordHash) {
    query.select("+passwordHash");
  }

  if (options.populateRoles !== false) {
    query.populate(USER_POPULATE_ROLES);
  }

  return query;
}

export function findUserByUsernameOrEmail(usernameOrEmail, options = {}) {
  const normalized = usernameOrEmail.trim().toLowerCase();
  const query = User.findOne({
    $or: [{ username: usernameOrEmail.trim() }, { email: normalized }]
  });

  if (options.includePasswordHash) {
    query.select("+passwordHash");
  }

  if (options.populateRoles !== false) {
    query.populate(USER_POPULATE_ROLES);
  }

  return query;
}

export function createUser(userData) {
  return User.create(userData);
}

export function updateUserById(id, update) {
  return User.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true
  }).populate(USER_POPULATE_ROLES);
}

export function updateUserPasswordHash(id, passwordHash) {
  return User.findByIdAndUpdate(id, { passwordHash }, { new: true });
}

export async function usernameOrEmailExists({ username, email, excludeUserId } = {}) {
  const conditions = [];

  if (username) {
    conditions.push({ username });
  }

  if (email) {
    conditions.push({ email: email.toLowerCase() });
  }

  if (conditions.length === 0) {
    return null;
  }

  const query = { $or: conditions };

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  return User.findOne(query).select("username email");
}

export async function upsertUserByEmail(email, userData) {
  return User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $setOnInsert: {
        ...userData,
        email: email.toLowerCase()
      }
    },
    { new: true, upsert: true }
  ).populate(USER_POPULATE_ROLES);
}
