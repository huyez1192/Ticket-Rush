import "./customer-freeform-seat-map.css";

export default function CustomerStageBlock({ stage }) {
  if (!stage) {
    return null;
  }

  const label = stage.label || "Stage";

  return (
    <div
      className="customer-freeform-stage"
      role="img"
      aria-label={label}
      style={{
        left: `${stage.x}px`,
        top: `${stage.y}px`,
        width: `${stage.width}px`,
        height: `${stage.height}px`,
      }}
    >
      <span>{label}</span>
    </div>
  );
}
