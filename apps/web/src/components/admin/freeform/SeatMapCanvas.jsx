import { useEffect, useRef, useState } from "react";
import { getSeatLayout, getSeatsIntersectingRect } from "../../../utils/freeformSeatLayout";
import CanvasGrid from "./CanvasGrid";
import DraggableSeat from "./DraggableSeat";
import StageBlock from "./StageBlock";
import "./freeform-seating.css";

export default function SeatMapCanvas({
  layout,
  seats = [],
  draftLayouts = {},
  dirtySeatIds = [],
  selectedSeatId,
  selectedSeatIds = [],
  selectedSectionId,
  showGrid,
  snapToGrid,
  fitToView,
  onSelectSeat,
  onSelectSeats,
  onClearSelection,
  onMoveSeat,
  onMoveSelectedSeats,
}) {
  const scrollRef = useRef(null);
  const pointerRef = useRef(null);
  const [visualScale, setVisualScale] = useState(1);
  const [marquee, setMarquee] = useState(null);
  const dirtySet = new Set(dirtySeatIds);
  const selectedSet = new Set(selectedSeatIds.length ? selectedSeatIds : selectedSeatId ? [selectedSeatId] : []);

  useEffect(() => {
    if (!fitToView || !scrollRef.current) {
      setVisualScale(1);
      return undefined;
    }

    const updateScale = () => {
      const width = scrollRef.current?.clientWidth || layout.canvasWidth;
      const height = scrollRef.current?.clientHeight || layout.canvasHeight;
      const nextScale = Math.min(1, Math.max(0.45, Math.min((width - 24) / layout.canvasWidth, (height - 24) / layout.canvasHeight)));
      setVisualScale(Number.isFinite(nextScale) ? nextScale : 1);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, [fitToView, layout.canvasHeight, layout.canvasWidth]);

  function handlePointerDown(event) {
    if (event.button !== 0 || event.target.closest(".freeform-seat")) {
      return;
    }

    const point = getCanvasPoint(event, visualScale);
    pointerRef.current = {
      pointerId: event.pointerId,
      start: point,
      add: event.shiftKey,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    const pointer = pointerRef.current;
    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }

    const point = getCanvasPoint(event, visualScale);
    const rect = normalizeRect(pointer.start, point);
    pointer.moved = rect.width > 4 || rect.height > 4;
    pointer.rect = rect;

    if (pointer.moved) {
      setMarquee(rect);
    }
  }

  function handlePointerUp(event) {
    const pointer = pointerRef.current;
    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    pointerRef.current = null;

    if (!pointer.moved) {
      setMarquee(null);
      onClearSelection?.();
      return;
    }

    const selectedSeats = getSeatsIntersectingRect(seats, draftLayouts, pointer.rect);
    onSelectSeats?.(selectedSeats, { add: pointer.add });
    setMarquee(null);
  }

  function handleCenterView() {
    const scrollNode = scrollRef.current;
    if (!scrollNode) {
      return;
    }

    const stageCenterX = (layout.stage.x + layout.stage.width / 2) * visualScale;
    const stageCenterY = (layout.stage.y + layout.stage.height / 2) * visualScale;
    scrollNode.scrollTo({
      left: Math.max(0, stageCenterX - scrollNode.clientWidth / 2),
      top: Math.max(0, stageCenterY - scrollNode.clientHeight / 3),
      behavior: "smooth",
    });
  }

  return (
    <div className="freeform-canvas-shell">
      <div className="freeform-canvas-shell__bar">
        <span>{Math.round(visualScale * 100)}% view</span>
        <button type="button" onClick={handleCenterView}>Center stage</button>
      </div>
      <div className="freeform-canvas-scroll" ref={scrollRef}>
        <div
          className="freeform-canvas-viewport"
          style={{
            width: `${layout.canvasWidth * visualScale}px`,
            height: `${layout.canvasHeight * visualScale}px`,
          }}
        >
          <div
            className="freeform-canvas"
            style={{
              width: `${layout.canvasWidth}px`,
              height: `${layout.canvasHeight}px`,
              transform: `scale(${visualScale})`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {showGrid ? <CanvasGrid gridSize={layout.gridSize} /> : null}
            <StageBlock stage={layout.stage} />
            {marquee ? (
              <div
                className="freeform-marquee"
                style={{
                  left: `${marquee.left}px`,
                  top: `${marquee.top}px`,
                  width: `${marquee.width}px`,
                  height: `${marquee.height}px`,
                }}
              />
            ) : null}
            {seats.map((seat) => {
              const seatLayout = getSeatLayout(seat, draftLayouts);
              const isDimmed = selectedSectionId && seat.sectionId !== selectedSectionId;

              return (
                <DraggableSeat
                  key={seat.id}
                  seat={seat}
                  layout={seatLayout}
                  selected={selectedSet.has(seat.id)}
                  dirty={dirtySet.has(seat.id)}
                  disabled={false}
                  canvas={layout}
                  snapToGrid={snapToGrid}
                  gridSize={layout.gridSize}
                  onSelect={onSelectSeat}
                  onMove={onMoveSeat}
                  onMoveGroup={onMoveSelectedSeats}
                  className={isDimmed ? "freeform-seat--dimmed" : ""}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCanvasPoint(event, visualScale) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / visualScale,
    y: (event.clientY - rect.top) / visualScale,
  };
}

function normalizeRect(start, end) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const right = Math.max(start.x, end.x);
  const bottom = Math.max(start.y, end.y);

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}
