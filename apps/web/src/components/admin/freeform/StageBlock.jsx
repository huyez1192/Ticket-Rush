import "./freeform-seating.css";

export default function StageBlock({ stage }) {
  return (
    <div
      className="freeform-stage"
      style={{
        left: `${stage.x}px`,
        top: `${stage.y}px`,
        width: `${stage.width}px`,
        height: `${stage.height}px`,
      }}
      aria-label={stage.label || "Stage"}
      role="img"
    >
      <span>{stage.label || "Stage"}</span>
    </div>
  );
}
