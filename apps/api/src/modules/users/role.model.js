import mongoose from "mongoose";
import { ROLE_VALUES } from "../../common/constants/index.js";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ROLE_VALUES,
      required: true,
      trim: true
    }
  },
  {
    collection: "roles",
    timestamps: false
  }
);

roleSchema.index({ name: 1 }, { unique: true, name: "idx_roles_name_unique" });

export const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);
