import { useEffect, useMemo, useState } from "react";
import {
  bulkUpdateSeatLayouts,
  updateSeatMapLayout,
} from "../../../api/adminApi";
import {
  autoArrangeSeatLayouts,
  buildBulkLayoutPayload,
  buildSeatLayoutMap,
  flattenSeatMapSections,
  getCanvasWarnings,
  getDirtySeatIds,
  getEffectiveLayoutConfig,
  getPlacedSeats,
  getUnplacedSeats,
  moveDraftSeatLayouts,
  reflowSeatLayoutsAfterResize,
  updateDraftSeatLayout,
} from "../../../utils/freeformSeatLayout";
import { mapApiError } from "../../../utils/mapApiError";
import Button from "../../common/Button";
import EmptyState from "../../common/EmptyState";
import ErrorState from "../../common/ErrorState";
import FreeformSeatLegend from "./FreeformSeatLegend";
import LayoutStatusBar from "./LayoutStatusBar";
import MultiSeatSelectionPanel from "./MultiSeatSelectionPanel";
import SeatInspectorPanel from "./SeatInspectorPanel";
import SeatLayoutToolbar from "./SeatLayoutToolbar";
import SeatMapCanvas from "./SeatMapCanvas";
import StageLayoutForm from "./StageLayoutForm";
import "./freeform-seating.css";

export default function AdminFreeformSeatDesigner({
  eventId,
  seatMap,
  selectedSeatId,
  onSelectSeat,
  onClearSeatSelection,
  onRefresh,
}) {
  const allSeats = useMemo(() => flattenSeatMapSections(seatMap.sections), [seatMap.sections]);
  const layoutConfig = useMemo(() => getEffectiveLayoutConfig(seatMap.layout, allSeats), [allSeats, seatMap.layout]);
  const [savedLayouts, setSavedLayouts] = useState({});
  const [draftLayouts, setDraftLayouts] = useState({});
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [fitToView, setFitToView] = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [stageSaving, setStageSaving] = useState(false);
  const [error, setError] = useState("");
  const [stageError, setStageError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const nextLayouts = buildSeatLayoutMap(allSeats);
    setSavedLayouts(nextLayouts);
    setDraftLayouts(nextLayouts);
    setSelectedSeatIds((current) => current.filter((seatId) => allSeats.some((seat) => seat.id === seatId)));
    setError("");
  }, [allSeats]);

  const dirtySeatIds = useMemo(
    () => getDirtySeatIds(allSeats, savedLayouts, draftLayouts),
    [allSeats, draftLayouts, savedLayouts],
  );
  const placedSeats = useMemo(() => getPlacedSeats(allSeats, draftLayouts), [allSeats, draftLayouts]);
  const unplacedSeats = useMemo(() => getUnplacedSeats(allSeats, draftLayouts), [allSeats, draftLayouts]);
  const warnings = useMemo(() => getCanvasWarnings(allSeats, layoutConfig, draftLayouts), [allSeats, draftLayouts, layoutConfig]);
  const primarySelectedSeatId = selectedSeatIds[0] || selectedSeatId;
  const selectedSeat = useMemo(() => allSeats.find((seat) => seat.id === primarySelectedSeatId) || null, [allSeats, primarySelectedSeatId]);
  const selectedSeats = useMemo(
    () => selectedSeatIds.map((seatId) => allSeats.find((seat) => seat.id === seatId)).filter(Boolean),
    [allSeats, selectedSeatIds],
  );
  const hasMatrixWithoutLayout = allSeats.length > 0 && placedSeats.length === 0;

  function handleSelectSeat(seat, event) {
    const shouldToggle = Boolean(event?.ctrlKey || event?.metaKey);

    setSelectedSeatIds((current) => {
      if (!shouldToggle && current.length > 1 && current.includes(seat.id)) {
        return current;
      }

      if (!shouldToggle) {
        return [seat.id];
      }

      return current.includes(seat.id) ? current.filter((seatId) => seatId !== seat.id) : [...current, seat.id];
    });
    onSelectSeat?.(seat);
  }

  function handleSelectSeats(seats, options = {}) {
    const ids = seats.map((seat) => seat.id);
    setSelectedSeatIds((current) => {
      const mergedIds = options.add ? Array.from(new Set([...current, ...ids])) : ids;
      return mergedIds;
    });

    if (seats[0]) {
      onSelectSeat?.(seats[0]);
    } else {
      onClearSeatSelection?.();
    }
  }

  function handleClearSelection() {
    setSelectedSeatIds([]);
    onClearSeatSelection?.();
  }

  function handleMoveSeat(seat, partialLayout) {
    setDraftLayouts((current) => updateDraftSeatLayout(current, seat, partialLayout, layoutConfig));
  }

  function handleMoveSelectedSeats(_seat, delta) {
    const movingSeats = selectedSeats.length ? selectedSeats : [_seat].filter(Boolean);
    setDraftLayouts((current) =>
      moveDraftSeatLayouts(current, movingSeats, delta, layoutConfig, snapToGrid, layoutConfig.gridSize),
    );
  }

  function handleInspectorChange(seat, partialLayout) {
    setDraftLayouts((current) => updateDraftSeatLayout(current, seat, partialLayout, layoutConfig));
    setNotice("Seat coordinates updated in draft.");
  }

  function handleBatchSizeChange(partialLayout) {
    setDraftLayouts((current) => reflowSeatLayoutsAfterResize(current, selectedSeats, partialLayout, layoutConfig));
    setNotice(`${selectedSeats.length} seats resized and reflowed in draft.`);
  }

  function handleDiscard() {
    setDraftLayouts(savedLayouts);
    setSelectedSeatIds(selectedSeatId ? [selectedSeatId] : []);
    setNotice("Unsaved layout changes discarded.");
    setError("");
  }

  function handleAutoArrange() {
    const arrangedLayouts = autoArrangeSeatLayouts(seatMap.sections, layoutConfig);
    setDraftLayouts((current) => ({ ...current, ...arrangedLayouts }));
    setNotice("Seats auto-arranged in draft. Click Save layout to persist.");
    setError("");
  }

  async function handleSaveLayout() {
    if (!dirtySeatIds.length) {
      return;
    }

    if (dirtySeatIds.length > 1000) {
      setError("Too many changed seats to save at once. Save fewer than 1000 changed seats.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = buildBulkLayoutPayload(allSeats, draftLayouts, dirtySeatIds);
      await bulkUpdateSeatLayouts(eventId, payload);
      setSavedLayouts(draftLayouts);
      setNotice("Seat layout saved.");
      await onRefresh?.();
    } catch (apiError) {
      setError(mapApiError(apiError).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveStage(payload) {
    setStageSaving(true);
    setStageError("");
    setNotice("");

    try {
      await updateSeatMapLayout(eventId, payload);
      setNotice("Stage and canvas layout saved.");
      await onRefresh?.();
    } catch (apiError) {
      setStageError(mapApiError(apiError).message);
    } finally {
      setStageSaving(false);
    }
  }

  return (
    <section className="admin-seating-panel freeform-designer">
      <header className="admin-seating-panel__header freeform-designer__header">
        <div>
          <h2>Configure the seating map</h2>
        </div>
        <FreeformSeatLegend sections={seatMap.sections.map((entry) => entry.section)} />
      </header>

      {notice ? <div className="freeform-alert freeform-alert--success">{notice}</div> : null}
      {error ? <ErrorState title="Layout action failed" message={error} /> : null}

      <SeatLayoutToolbar
        dirtyCount={dirtySeatIds.length}
        saving={saving}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        onSave={handleSaveLayout}
        onDiscard={handleDiscard}
        onAutoArrange={handleAutoArrange}
        onToggleGrid={() => setShowGrid((current) => !current)}
        onToggleSnap={() => setSnapToGrid((current) => !current)}
        fitToView={fitToView}
        onToggleFit={() => setFitToView((current) => !current)}
      />

      <LayoutStatusBar
        totalSeats={allSeats.length}
        placedSeats={placedSeats.length}
        unplacedSeats={unplacedSeats.length}
        dirtyCount={dirtySeatIds.length}
        canvas={layoutConfig}
        warnings={warnings}
      />

      {hasMatrixWithoutLayout ? (
        <div className="freeform-alert freeform-alert--warning">
          <div>
            <strong>This event has matrix seats but no saved freeform layout yet.</strong>
            <span>Use Auto arrange to create draft coordinates, then save the layout.</span>
          </div>
          <Button size="sm" variant="secondary" onClick={handleAutoArrange}>
            Auto arrange
          </Button>
        </div>
      ) : null}

      {!allSeats.length ? (
        <EmptyState
          title="No seats generated"
          message="Create a section and generate seats before designing a freeform layout."
        />
      ) : (
        <div className="freeform-designer__workspace">
          <div className="freeform-designer__canvas-area">
            <SeatMapCanvas
              layout={layoutConfig}
              seats={placedSeats}
              draftLayouts={draftLayouts}
              dirtySeatIds={dirtySeatIds}
              selectedSeatId={selectedSeatId}
              selectedSeatIds={selectedSeatIds}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              fitToView={fitToView}
              onSelectSeat={handleSelectSeat}
              onSelectSeats={handleSelectSeats}
              onClearSelection={handleClearSelection}
              onMoveSeat={handleMoveSeat}
              onMoveSelectedSeats={handleMoveSelectedSeats}
            />
          </div>
          <aside className="freeform-designer__side">
            {selectedSeats.length > 1 ? (
              <MultiSeatSelectionPanel
                seats={selectedSeats}
                draftLayouts={draftLayouts}
                onApplySize={handleBatchSizeChange}
                onClear={handleClearSelection}
              />
            ) : (
              <SeatInspectorPanel
                seat={selectedSeat}
                draftLayouts={draftLayouts}
                layoutConfig={layoutConfig}
                onDraftChange={handleInspectorChange}
              />
            )}
            <StageLayoutForm layout={layoutConfig} onSubmit={handleSaveStage} loading={stageSaving} error={stageError} />
          </aside>
        </div>
      )}
    </section>
  );
}
