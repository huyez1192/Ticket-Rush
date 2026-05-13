import { useMemo, useState } from "react";
import { SEAT_SHAPE_OPTIONS, getSeatShapeClassName, normalizeSeatShape } from "../../constants/seatShapes";
import { buildSectionPayload } from "../../utils/adminSeatMappers";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import "../seat/seat-shapes.css";
import "./admin-seating.css";

export default function AdminSectionForm({ section, onSubmit, onCancel, loading, apiError }) {
  const initialValues = useMemo(
    () => ({
      name: section?.name || "",
      price: section?.price ?? "",
      description: section?.description || "",
      color: section?.color || "",
      displayOrder: section?.displayOrder ?? "",
      defaultSeatWidth: section?.defaultSeatWidth ?? 32,
      defaultSeatHeight: section?.defaultSeatHeight ?? 32,
      seatShape: normalizeSeatShape(section?.seatShape),
    }),
    [section],
  );
  const [values, setValues] = useState(initialValues);
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

    onSubmit?.(buildSectionPayload(values));
  }

  return (
    <form className="admin-form admin-seating-form" onSubmit={handleSubmit}>
      {apiError ? <p className="field__error">{apiError}</p> : null}
      <Input label="Section name" name="name" value={values.name} onChange={handleChange} error={errors.name} />
      <Input
        label="Price"
        name="price"
        type="number"
        min="0.01"
        step="0.01"
        value={values.price}
        onChange={handleChange}
        error={errors.price}
      />
      <Textarea
        label="Description"
        name="description"
        value={values.description}
        onChange={handleChange}
        helper="Optional section note shown to admins and customers where supported."
      />
      <Select
        label="Seat shape"
        name="seatShape"
        value={values.seatShape}
        onChange={handleChange}
        helper="Shape distinguishes section types. Seat color remains status-based."
      >
        {SEAT_SHAPE_OPTIONS.map((shape) => (
          <option key={shape.value} value={shape.value}>
            {shape.label}
          </option>
        ))}
      </Select>
      <div className="admin-section-shape-preview" aria-label="Selected seat shape preview">
        <span className={`seat-shape-icon ${getSeatShapeClassName(values.seatShape)}`} aria-hidden="true">
          <span>{values.name?.trim()?.slice(0, 2) || "S"}</span>
        </span>
        <span>{SEAT_SHAPE_OPTIONS.find((shape) => shape.value === values.seatShape)?.description}</span>
      </div>
      <div className="admin-seating-form__grid">
        <Input label="Section color" name="color" type="text" value={values.color} onChange={handleChange} />
        <Input
          label="Display order"
          name="displayOrder"
          type="number"
          step="1"
          value={values.displayOrder}
          onChange={handleChange}
        />
        <Input
          label="Default seat width"
          name="defaultSeatWidth"
          type="number"
          min="1"
          step="1"
          value={values.defaultSeatWidth}
          onChange={handleChange}
          error={errors.defaultSeatWidth}
        />
        <Input
          label="Default seat height"
          name="defaultSeatHeight"
          type="number"
          min="1"
          step="1"
          value={values.defaultSeatHeight}
          onChange={handleChange}
          error={errors.defaultSeatHeight}
        />
      </div>
      <div className="admin-form__actions">
        <Button type="submit" loading={loading}>
          {section ? "Save section" : "Create section"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function validate(values) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = "Section name is required.";
  }

  if (!Number.isFinite(Number(values.price)) || Number(values.price) <= 0) {
    errors.price = "Price must be greater than 0.";
  }

  if (!Number.isFinite(Number(values.defaultSeatWidth)) || Number(values.defaultSeatWidth) <= 0) {
    errors.defaultSeatWidth = "Width must be greater than 0.";
  }

  if (!Number.isFinite(Number(values.defaultSeatHeight)) || Number(values.defaultSeatHeight) <= 0) {
    errors.defaultSeatHeight = "Height must be greater than 0.";
  }

  return errors;
}
