import { useMemo, useState } from "react";
import { buildSectionPayload } from "../../utils/adminSeatMappers";
import Button from "../common/Button";
import Input from "../common/Input";
import Textarea from "../common/Textarea";
import "./admin-seating.css";

export default function AdminSectionForm({ section, onSubmit, onCancel, loading, apiError }) {
  const initialValues = useMemo(
    () => ({
      name: section?.name || "",
      price: section?.price ?? "",
      description: section?.description || "",
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

  return errors;
}
