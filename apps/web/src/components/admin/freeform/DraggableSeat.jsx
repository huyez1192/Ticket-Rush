import { useRef } from "react";
import { getSeatShapeClassName } from "../../../constants/seatShapes";
import { getSeatDisplayLabel } from "../../../utils/seatDisplayLabels";
import { getSeatStatusMeta } from "../../../utils/seatStatus";
import "../../seat/seat-shapes.css";
import "./freeform-seating.css";

export default function DraggableSeat({
  seat,
  layout,
  selected,
  dirty,
  disabled = false,
  canvas,
  snapToGrid = false,
  gridSize = 16,
  className = "",
  onSelect,
  onMove,
  onMoveGroup,
}) {
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const statusMeta = getSeatStatusMeta(seat.status);
  const displayLabel = getSeatDisplayLabel(seat);
  const label = `${seat.sectionName}, ${displayLabel}, ${statusMeta.label}`;

  function handlePointerDown(event) {
    if (disabled) {
      return;
    }

    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: Number(layout.x || 0),
      startY: Number(layout.y || 0),
      lastDx: 0,
      lastDy: 0,
      moved: false,
    };
    if (!event.ctrlKey && !event.metaKey) {
      onSelect?.(seat, event);
    }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      drag.moved = true;
    }

    const width = Number(layout.width || 32);
    const height = Number(layout.height || 32);
    let nextX = clamp(drag.startX + dx, 0, Math.max(0, canvas.canvasWidth - width));
    let nextY = clamp(drag.startY + dy, 0, Math.max(0, canvas.canvasHeight - height));

    if (snapToGrid && gridSize > 0) {
      nextX = Math.round(nextX / gridSize) * gridSize;
      nextY = Math.round(nextY / gridSize) * gridSize;
    }

    if (selected && onMoveGroup) {
      onMoveGroup(seat, { x: dx - drag.lastDx, y: dy - drag.lastDy });
      drag.lastDx = dx;
      drag.lastDy = dy;
      return;
    }

    onMove?.(seat, { x: nextX, y: nextY });
  }

  function handlePointerUp(event) {
    suppressClickRef.current = Boolean(dragRef.current?.moved);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  }

  function handleClick(event) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    onSelect?.(seat, event);
  }

  return (
    <button
      type="button"
      className={[
        "freeform-seat",
        "seat-shape-shell",
        `freeform-seat--${seat.status.toLowerCase()}`,
        getSeatShapeClassName(seat.seatShape),
        selected ? "freeform-seat--selected" : "",
        dirty ? "freeform-seat--dirty" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${layout.x}px`,
        top: `${layout.y}px`,
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        "--seat-visual-size": `${Math.min(Number(layout.width || 32), Number(layout.height || 32))}px`,
        transform: `rotate(${layout.rotation || 0}deg)`,
      }}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <span className="seat-shape-visual">
        <span className="seat-shape-label">{displayLabel}</span>
      </span>
      {dirty ? <span className="seat-dirty-marker" aria-hidden="true" /> : null}
    </button>
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
