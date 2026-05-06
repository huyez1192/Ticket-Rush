import { useMemo, useState } from "react";
import { EVENT_STATUSES } from "../../constants/statuses";
import { buildEventPayload, getEventFormInitialValues } from "../../utils/adminEventMappers";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import "./admin.css";

export default function AdminEventForm({ event, mode = "create", onSubmit, onCancel, loading, apiError }) {
  const initialValues = useMemo(() => getEventFormInitialValues(event), [event]);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const isCreate = mode === "create";

  function handleChange(changeEvent) {
    const { name, value } = changeEvent.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    const nextErrors = validate(values, isCreate);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    onSubmit?.(buildEventPayload(values, { includeStatus: isCreate }));
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {apiError ? <p className="field__error">{apiError}</p> : null}
      <div className="admin-form__grid">
        <Input label="Event name" name="name" value={values.name} onChange={handleChange} error={errors.name} />
        <Input label="Location" name="location" value={values.location} onChange={handleChange} error={errors.location} />
        <Input
          label="Start time"
          name="startTime"
          type="datetime-local"
          value={values.startTime}
          onChange={handleChange}
          error={errors.startTime}
        />
        <Input
          label="End time"
          name="endTime"
          type="datetime-local"
          value={values.endTime}
          onChange={handleChange}
          error={errors.endTime}
        />
        {isCreate ? (
          <Select label="Initial status" name="status" value={values.status} onChange={handleChange}>
            {EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        ) : null}
        <Textarea
          className="admin-form__full"
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          error={errors.description}
        />
        {isCreate ? (
          <Textarea
            className="admin-form__full"
            label="Image URLs"
            name="imageUrls"
            value={values.imageUrls}
            onChange={handleChange}
            helper="Optional. Separate URLs with commas or new lines."
          />
        ) : null}
      </div>
      <div className="admin-form__actions">
        <Button type="submit" loading={loading}>
          {isCreate ? "Create event" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function validate(values, isCreate) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = "Event name is required.";
  }

  if (!values.location?.trim()) {
    errors.location = "Location is required.";
  }

  if (!values.startTime) {
    errors.startTime = "Start time is required.";
  }

  if (!values.endTime) {
    errors.endTime = "End time is required.";
  }

  if (values.startTime && values.endTime && new Date(values.endTime) <= new Date(values.startTime)) {
    errors.endTime = "End time must be after start time.";
  }

  if (isCreate && !EVENT_STATUSES.includes(values.status)) {
    errors.status = "Choose a valid event status.";
  }

  return errors;
}
