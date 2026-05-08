import { useEffect, useRef, useState } from "react";
import "./customer-freeform-seat-map.css";

export default function CustomerSeatMapViewport({ layout, children }) {
  const scrollRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const scrollNode = scrollRef.current;

    if (!scrollNode) {
      return undefined;
    }

    const updateScale = () => {
      const availableWidth = scrollNode.clientWidth - 24;
      const widthFitScale = availableWidth / layout.canvasWidth;
      const nextScale = widthFitScale >= 0.82 ? Math.min(1, widthFitScale) : 0.82;
      setScale(Number.isFinite(nextScale) ? nextScale : 1);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(scrollNode);
    return () => observer.disconnect();
  }, [layout.canvasWidth]);

  function handleCenterStage() {
    const scrollNode = scrollRef.current;

    if (!scrollNode || !layout.stage) {
      return;
    }

    const centerX = (layout.stage.x + layout.stage.width / 2) * scale;
    const centerY = (layout.stage.y + layout.stage.height / 2) * scale;
    scrollNode.scrollTo({
      left: Math.max(0, centerX - scrollNode.clientWidth / 2),
      top: Math.max(0, centerY - scrollNode.clientHeight / 3),
      behavior: "smooth",
    });
  }

  return (
    <div className="customer-freeform-viewport">
      <div className="customer-freeform-viewport__bar">
        <span>{Math.round(scale * 100)}% view</span>
        <button type="button" onClick={handleCenterStage}>
          Center stage
        </button>
      </div>
      <div className="customer-freeform-viewport__scroll" ref={scrollRef}>
        <div
          className="customer-freeform-viewport__size"
          style={{
            width: `${layout.canvasWidth * scale}px`,
            height: `${layout.canvasHeight * scale}px`,
          }}
        >
          <div
            className="customer-freeform-viewport__canvas"
            style={{
              width: `${layout.canvasWidth}px`,
              height: `${layout.canvasHeight}px`,
              transform: `scale(${scale})`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
