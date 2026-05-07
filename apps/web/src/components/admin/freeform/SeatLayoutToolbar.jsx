import Button from "../../common/Button";
import "./freeform-seating.css";

export default function SeatLayoutToolbar({
  dirtyCount,
  saving,
  showGrid,
  snapToGrid,
  fitToView,
  onSave,
  onDiscard,
  onAutoArrange,
  onToggleGrid,
  onToggleSnap,
  onToggleFit,
}) {
  return (
    <div className="freeform-toolbar">
      <div className="freeform-toolbar__state" aria-live="polite">
        {dirtyCount ? `${dirtyCount} unsaved seat changes` : "Layout saved"}
      </div>
      <div className="freeform-toolbar__actions">
        <Button size="sm" onClick={onSave} loading={saving} disabled={!dirtyCount}>
          Save layout
        </Button>
        <Button size="sm" variant="outline" onClick={onDiscard} disabled={!dirtyCount || saving}>
          Discard
        </Button>
        <Button size="sm" variant="secondary" onClick={onAutoArrange} disabled={saving}>
          Auto arrange
        </Button>
        <Button size="sm" variant={showGrid ? "outline" : "ghost"} onClick={onToggleGrid}>
          {showGrid ? "Hide grid" : "Show grid"}
        </Button>
        <Button size="sm" variant={snapToGrid ? "outline" : "ghost"} onClick={onToggleSnap}>
          {snapToGrid ? "Snap on" : "Snap off"}
        </Button>
        <Button size="sm" variant={fitToView ? "outline" : "ghost"} onClick={onToggleFit}>
          {fitToView ? "Fit view" : "Actual size"}
        </Button>
      </div>
    </div>
  );
}
