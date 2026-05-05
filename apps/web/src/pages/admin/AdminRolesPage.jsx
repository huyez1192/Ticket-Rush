import AdminPageShell from "./AdminPageShell";

export default function AdminRolesPage() {
  return (
    <AdminPageShell
      title="Roles"
      purpose="Derived read-only admin roles shell."
      note="Phase 13 should decide whether this remains standalone or is folded into user role assignment."
      status="Published"
    />
  );
}
