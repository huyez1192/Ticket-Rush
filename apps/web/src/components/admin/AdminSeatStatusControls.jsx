import { useEffect, useState } from "react";
import { getSeatDisplayLabel, getSeatDisplayRowLabel } from "../../utils/seatDisplayLabels";
import Button from "../common/Button";
import Select from "../common/Select";
import StatusBadge from "../common/StatusBadge";
import "./admin-seating.css";

const SAFE_STATUS_OPTIONS = [
  { value: "Available", label: "Available" },
  { value: "Locked", label: "Locked" },
  { value: "Released", label: "Released" },
];

export default function AdminSeatStatusControls({ seat, onSubmit, loading, error }) {
  const [status, setStatus] = useState("Available");

  useEffect(() => {
    if (!seat) {
      setStatus("Available");
      return;
    }

    setStatus(seat.status === "Sold" ? "Available" : seat.status);
  }, [seat]);

  if (!seat) {
    return (
      <section className="admin-seating-panel">
        <header className="admin-seating-panel__header">
          <div>
            <h2>Seat status</h2>
            <p>Select a seat in the preview to update safe admin statuses.</p>
          </div>
        </header>
        <p className="admin-seat-status-empty">No seat selected.</p>
      </section>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.(seat, { status });
  }

  const displayLabel = getSeatDisplayLabel(seat);

  return (
    <section className="admin-seating-panel">
      <header className="admin-seating-panel__header">
        <div>
          <h2>Seat status</h2>
          <p>{displayLabel}</p>
        </div>
        <StatusBadge status={seat.status} />
      </header>
      <form className="admin-seat-status-form" onSubmit={handleSubmit}>
        {error ? <p className="field__error admin-form__full">{error}</p> : null}
        <dl className="admin-seat-status-details">
          <div>
            <dt>Section</dt>
            <dd>{seat.sectionName}</dd>
          </div>
          <div>
            <dt>Row</dt>
            <dd>{getSeatDisplayRowLabel(seat) || seat.rowLabel}</dd>
          </div>
          <div>
            <dt>Seat</dt>
            <dd>{displayLabel}</dd>
          </div>
        </dl>
        <Select
          label="New status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={SAFE_STATUS_OPTIONS}
          helper="Sold is reserved for checkout/order flow."
          disabled={loading}
        />
        <Button type="submit" loading={loading}>
          Update seat
        </Button>
      </form>
    </section>
  );
}
