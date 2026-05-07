import "./freeform-seating.css";

export default function LayoutStatusBar({ totalSeats, placedSeats, unplacedSeats, dirtyCount, canvas, warnings }) {
  return (
    <dl className="freeform-status-bar">
      <div>
        <dt>Total</dt>
        <dd>{totalSeats}</dd>
      </div>
      <div>
        <dt>Placed</dt>
        <dd>{placedSeats}</dd>
      </div>
      <div>
        <dt>Unplaced</dt>
        <dd>{unplacedSeats}</dd>
      </div>
      <div>
        <dt>Unsaved</dt>
        <dd>{dirtyCount}</dd>
      </div>
      <div>
        <dt>Canvas</dt>
        <dd>
          {canvas.canvasWidth} x {canvas.canvasHeight}
        </dd>
      </div>
      <div className={warnings?.outsideCount ? "freeform-status-bar__warning" : ""}>
        <dt>Bounds</dt>
        <dd>{warnings?.outsideCount ? `${warnings.outsideCount} outside` : "OK"}</dd>
      </div>
    </dl>
  );
}
