import mongoose from "mongoose";
import { GENDER_VALUES } from "../../common/constants/index.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    fullName: {
      type: String,
      trim: true
    },
    avatarUrl: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: GENDER_VALUES
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: true
      }
    ]
  },
  {
    collection: "users",
    timestamps: true
  }
);

userSchema.index({ username: 1 }, { unique: true, name: "idx_users_username_unique" });
userSchema.index({ email: 1 }, { unique: true, name: "idx_users_email_unique" });
userSchema.index({ roles: 1 }, { name: "idx_users_roles" });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
