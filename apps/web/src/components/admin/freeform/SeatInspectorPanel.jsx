import { useEffect, useMemo, useState } from "react";
import { getSeatLayout, roundLayoutNumber } from "../../../utils/freeformSeatLayout";
import Button from "../../common/Button";
import Input from "../../common/Input";
import StatusBadge from "../../common/StatusBadge";
import "./freeform-seating.css";

export default function SeatInspectorPanel({ seat, draftLayouts, layoutConfig, onDraftChange }) {
  const currentLayout = useMemo(() => (seat ? getSeatLayout(seat, draftLayouts) : null), [draftLayouts, seat]);
  const [values, setValues] = useState(getInitialValues(currentLayout));

  useEffect(() => {
    setValues(getInitialValues(currentLayout));
  }, [currentLayout]);

  if (!seat || !currentLayout) {
    return (
      <section className="freeform-side-panel">
        <header className="freeform-side-panel__header">
          <div>
            <h3>Seat inspector</h3>
            <p>Select a seat on the canvas.</p>
          </div>
        </header>
        <p className="freeform-empty-copy">No seat selected.</p>
      </section>
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleApply(event) {
    event.preventDefault();
    const nextLayout = {
      x: Number(values.x),
      y: Number(values.y),
      width: Number(values.width),
      height: Number(values.height),
      label: values.label.trim(),
    };

    onDraftChange?.(seat, nextLayout);
  }

  const soldWarning = seat.status === "Sold" ? "This seat is sold. Moving it changes the visual map only; tickets still reference this seat." : "";

  return (
    <section className="freeform-side-panel">
      <header className="freeform-side-panel__header">
        <div>
          <h3>Seat inspector</h3>
          <p>{seat.code || seat.label}</p>
        </div>
        <StatusBadge status={seat.status} />
      </header>

      <dl className="freeform-inspector-details">
        <div>
          <dt>Section</dt>
          <dd>{seat.sectionName}</dd>
        </div>
        <div>
          <dt>Row</dt>
          <dd>{seat.rowLabel}</dd>
        </div>
        <div>
          <dt>Seat</dt>
          <dd>{seat.seatNumber}</dd>
        </div>
      </dl>

      {soldWarning ? <p className="freeform-warning">{soldWarning}</p> : null}

      <form className="freeform-inspector-form" onSubmit={handleApply}>
        <Input label="X" name="x" type="number" min="0" max={layoutConfig.canvasWidth} value={values.x} onChange={handleChange} />
        <Input label="Y" name="y" type="number" min="0" max={layoutConfig.canvasHeight} value={values.y} onChange={handleChange} />
        <Input label="Width" name="width" type="number" min="16" value={values.width} onChange={handleChange} />
        <Input label="Height" name="height" type="number" min="16" value={values.height} onChange={handleChange} />
        <Input label="Label" name="label" value={values.label} onChange={handleChange} className="freeform-form__full" />
        <Button type="submit" size="sm" className="freeform-form__full">
          Apply to draft
        </Button>
      </form>
    </section>
  );
}

function getInitialValues(layout) {
  return {
    x: layout?.x === null ? "" : String(roundLayoutNumber(layout?.x || 0)),
    y: layout?.y === null ? "" : String(roundLayoutNumber(layout?.y || 0)),
    width: String(roundLayoutNumber(layout?.width || 32)),
    height: String(roundLayoutNumber(layout?.height || 32)),
    label: layout?.label || "",
  };
}
