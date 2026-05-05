import { Role } from "./role.model.js";

export function findRoleByName(name) {
  return Role.findOne({ name });
}

export function findRolesByNames(names) {
  return Role.find({ name: { $in: names } });
}

export function findRolesByIds(roleIds) {
  return Role.find({ _id: { $in: roleIds } });
}

export async function upsertRoleByName(name) {
  return Role.findOneAndUpdate({ name }, { $setOnInsert: { name } }, { new: true, upsert: true });
}
