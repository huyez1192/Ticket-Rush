import Select from "../common/Select";
import "./admin.css";

export default function AdminDashboardEventSelector({ events = [], value, onChange, disabled }) {
  return (
    <Select
      label="Event analytics"
      name="dashboardEventId"
      value={value || ""}
      onChange={(event) => onChange?.(event.target.value)}
      disabled={disabled || events.length === 0}
      helper={events.length ? "Revenue, occupancy, and demographics are fetched for the selected event." : "No public events available for analytics selection."}
    >
      <option value="">Choose an event</option>
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name} - {event.status}
        </option>
      ))}
    </Select>
  );
}
