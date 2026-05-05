import AdminPageShell from "./AdminPageShell";

export default function AdminEventsPage() {
  return (
    <AdminPageShell
      title="Events"
      purpose="Admin event management shell for list, filters, lifecycle actions, and create/update workflows."
      note="Phase 13 will add event APIs. Status changes must use dedicated lifecycle endpoints, not PUT event status."
      status="Draft"
    />
  );
}
