import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import "./freeform-seating.css";

export default function StageLayoutForm({ layout, onSubmit, loading, error }) {
  const [values, setValues] = useState(toValues(layout));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(toValues(layout));
    setErrors({});
  }, [layout]);

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

    onSubmit?.({
      canvasWidth: Number(values.canvasWidth),
      canvasHeight: Number(values.canvasHeight),
      gridSize: Number(values.gridSize),
      stage: {
        x: Number(values.stageX),
        y: Number(values.stageY),
        width: Number(values.stageWidth),
        height: Number(values.stageHeight),
        label: values.stageLabel.trim() || "Stage",
      },
      defaultZoom: Number(values.defaultZoom),
      viewport: {
        x: Number(values.viewportX),
        y: Number(values.viewportY),
        zoom: Number(values.viewportZoom),
      },
    });
  }

  return (
    <section className="freeform-side-panel">
      <header className="freeform-side-panel__header">
        <div>
          <h3>Stage and canvas</h3>
          <p>Persist venue dimensions and stage placement.</p>
        </div>
      </header>
      <form className="freeform-stage-form" onSubmit={handleSubmit}>
        {error ? <p className="field__error freeform-form__full">{error}</p> : null}
        <Input label="Canvas width" name="canvasWidth" type="number" min="320" value={values.canvasWidth} onChange={handleChange} error={errors.canvasWidth} />
        <Input label="Canvas height" name="canvasHeight" type="number" min="320" value={values.canvasHeight} onChange={handleChange} error={errors.canvasHeight} />
        <Input label="Grid" name="gridSize" type="number" min="4" value={values.gridSize} onChange={handleChange} error={errors.gridSize} />
        <Input label="Zoom" name="defaultZoom" type="number" min="0.25" step="0.05" value={values.defaultZoom} onChange={handleChange} error={errors.defaultZoom} />
        <Input label="Stage X" name="stageX" type="number" min="0" value={values.stageX} onChange={handleChange} error={errors.stageX} />
        <Input label="Stage Y" name="stageY" type="number" min="0" value={values.stageY} onChange={handleChange} error={errors.stageY} />
        <Input label="Stage width" name="stageWidth" type="number" min="40" value={values.stageWidth} onChange={handleChange} error={errors.stageWidth} />
        <Input label="Stage height" name="stageHeight" type="number" min="24" value={values.stageHeight} onChange={handleChange} error={errors.stageHeight} />
        <Input label="Stage label" name="stageLabel" value={values.stageLabel} onChange={handleChange} className="freeform-form__full" />
        <Button type="submit" size="sm" loading={loading} className="freeform-form__full">
          Save stage and canvas
        </Button>
      </form>
    </section>
  );
}

function toValues(layout) {
  return {
    canvasWidth: String(layout.canvasWidth || 1200),
    canvasHeight: String(layout.canvasHeight || 720),
    gridSize: String(layout.gridSize || 16),
    defaultZoom: String(layout.defaultZoom || 1),
    viewportX: String(layout.viewport?.x || 0),
    viewportY: String(layout.viewport?.y || 0),
    viewportZoom: String(layout.viewport?.zoom || 1),
    stageX: String(layout.stage?.x || 360),
    stageY: String(layout.stage?.y || 48),
    stageWidth: String(layout.stage?.width || 480),
    stageHeight: String(layout.stage?.height || 72),
    stageLabel: layout.stage?.label || "Stage",
  };
}

function validate(values) {
  const errors = {};
  ["canvasWidth", "canvasHeight"].forEach((field) => {
    if (!Number.isFinite(Number(values[field])) || Number(values[field]) < 320) {
      errors[field] = "Minimum is 320.";
    }
  });
  ["gridSize", "defaultZoom", "stageWidth", "stageHeight"].forEach((field) => {
    if (!Number.isFinite(Number(values[field])) || Number(values[field]) <= 0) {
      errors[field] = "Must be greater than 0.";
    }
  });
  ["stageX", "stageY"].forEach((field) => {
    if (!Number.isFinite(Number(values[field])) || Number(values[field]) < 0) {
      errors[field] = "Must be 0 or greater.";
    }
  });

  return errors;
}
