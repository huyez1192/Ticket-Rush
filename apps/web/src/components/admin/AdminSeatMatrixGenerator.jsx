import { useState } from "react";
import { buildGenerateSeatsPayload } from "../../utils/adminSeatMappers";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import "./admin-seating.css";

const INITIAL_STATUS_OPTIONS = [
  { value: "Available", label: "Available" },
  { value: "Released", label: "Released" },
  { value: "Locked", label: "Locked" },
];

export default function AdminSeatMatrixGenerator({ section, onSubmit, loading, error }) {
  const [values, setValues] = useState({ rows: "8", seatsPerRow: "12", initialStatus: "Available" });
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    onSubmit?.(section, buildGenerateSeatsPayload(values));
  }

  return (
    <section className="admin-seating-panel">
      <header className="admin-seating-panel__header">
        <div>
          <h2>Seat matrix</h2>
          <p>{section ? `Generate seats for ${section.name}.` : "Choose a section to generate seats."}</p>
        </div>
      </header>
      <form className="admin-seating-grid-form" onSubmit={handleSubmit}>
        {error ? <p className="field__error admin-form__full">{error}</p> : null}
        <Input
          label="Rows"
          name="rows"
          type="number"
          min="1"
          value={values.rows}
          onChange={handleChange}
          error={errors.rows}
          disabled={!section || loading}
        />
        <Input
          label="Seats per row"
          name="seatsPerRow"
          type="number"
          min="1"
          value={values.seatsPerRow}
          onChange={handleChange}
          error={errors.seatsPerRow}
          disabled={!section || loading}
        />
        <Select
          label="Initial status"
          name="initialStatus"
          value={values.initialStatus}
          onChange={handleChange}
          options={INITIAL_STATUS_OPTIONS}
          disabled={!section || loading}
          helper="Sold is intentionally not available for direct generation."
        />
        <Button type="submit" loading={loading} disabled={!section}>
          Generate seats
        </Button>
      </form>
    </section>
  );
}

function validate(values) {
  const errors = {};

  if (!Number.isInteger(Number(values.rows)) || Number(values.rows) < 1) {
    errors.rows = "Rows must be at least 1.";
  }

  if (!Number.isInteger(Number(values.seatsPerRow)) || Number(values.seatsPerRow) < 1) {
    errors.seatsPerRow = "Seats per row must be at least 1.";
  }

  return errors;
}
