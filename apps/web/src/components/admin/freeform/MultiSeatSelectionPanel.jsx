import { useEffect, useMemo, useState } from "react";
import { getSeatLayout, roundLayoutNumber } from "../../../utils/freeformSeatLayout";
import Button from "../../common/Button";
import Input from "../../common/Input";
import "./freeform-seating.css";

export default function MultiSeatSelectionPanel({ seats = [], draftLayouts = {}, onApplySize, onClear }) {
  const defaults = useMemo(() => getSharedSize(seats, draftLayouts), [draftLayouts, seats]);
  const [values, setValues] = useState(defaults);

  useEffect(() => {
    setValues(defaults);
  }, [defaults]);

  if (seats.length < 2) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onApplySize?.({
      width: Number(values.width),
      height: Number(values.height),
    });
  }

  return (
    <section className="freeform-side-panel freeform-batch-panel">
      <header className="freeform-side-panel__header">
        <div>
          <h3>Batch edit</h3>
          <p>{seats.length} seats selected. Draft-only until Save layout.</p>
        </div>
        <Button size="sm" variant="outline" onClick={onClear}>
          Clear
        </Button>
      </header>

      <form className="freeform-batch-form" onSubmit={handleSubmit}>
        <Input label="Width" name="width" type="number" min="16" value={values.width} onChange={handleChange} />
        <Input label="Height" name="height" type="number" min="16" value={values.height} onChange={handleChange} />
        <p className="freeform-batch-note freeform-form__full">
          Applying size reflows the selected seats by their current visual rows to preserve spacing.
        </p>
        <Button type="submit" size="sm" className="freeform-form__full">
          Apply size to selected
        </Button>
      </form>
    </section>
  );
}

function getSharedSize(seats, draftLayouts) {
  const firstLayout = seats[0] ? getSeatLayout(seats[0], draftLayouts) : null;

  if (!firstLayout) {
    return { width: "32", height: "32" };
  }

  return {
    width: String(roundLayoutNumber(firstLayout.width || 32)),
    height: String(roundLayoutNumber(firstLayout.height || 32)),
  };
}
