import AdminPageShell from "./AdminPageShell";

export default function AdminUsersPage() {
  return (
    <AdminPageShell
      title="Users"
      purpose="Derived admin user-management shell for list, detail, delete, and role assignment."
      note="Phase 13 will use the Phase 7.7 admin user endpoints and preserve last-admin/self-protection behavior."
      status="Published"
    />
  );
}
