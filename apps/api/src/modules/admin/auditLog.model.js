import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    entityType: {
      type: String,
      trim: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    collection: "audit_logs",
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

auditLogSchema.index({ userId: 1 }, { name: "idx_audit_logs_user_id" });
auditLogSchema.index({ createdAt: 1 }, { name: "idx_audit_logs_created_at" });

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
