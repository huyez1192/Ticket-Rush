import AdminPageShell from "./AdminPageShell";

export default function AdminOrdersPage() {
  return (
    <AdminPageShell
      title="Orders"
      purpose="Admin sold-ticket and order-management shell."
      note="Phase 13 will wire admin order list/detail and ticket verification flows. There is no direct admin ticket-list endpoint."
      status="Paid"
    />
  );
}
