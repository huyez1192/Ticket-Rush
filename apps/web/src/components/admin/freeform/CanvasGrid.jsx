import "./freeform-seating.css";

export default function CanvasGrid({ gridSize = 16 }) {
  return (
    <div
      className="freeform-canvas-grid"
      style={{
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
      aria-hidden="true"
    />
  );
}
