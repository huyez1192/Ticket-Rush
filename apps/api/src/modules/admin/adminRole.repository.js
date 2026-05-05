import { Role } from "../users/role.model.js";

export function findRoles() {
  return Role.find({}).sort({ name: 1, _id: 1 }).lean();
}

export function findRoleById(roleId) {
  return Role.findById(roleId).lean();
}

export function findRolesByIds(roleIds) {
  return Role.find({ _id: { $in: roleIds } }).lean();
}

export function findRoleByName(name) {
  return Role.findOne({ name }).lean();
}

