import AdminPageShell from "./AdminPageShell";

export default function AdminAuditLogsPage() {
  return (
    <AdminPageShell
      title="Audit logs"
      purpose="Derived admin audit-log list shell."
      note="Audit listing exists, but backend writes are sparse. Phase 13 should label this limitation clearly."
      status="Pending"
    />
  );
}
