import { getSeatShapeClassName } from "../../constants/seatShapes";
import { formatCurrency } from "../../utils/formatCurrency";
import { getSectionSeatStats } from "../../utils/adminSeatMappers";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";
import "../seat/seat-shapes.css";
import "./admin-seating.css";

export default function AdminSectionList({
  sections = [],
  sectionSeatMap = new Map(),
  selectedSectionId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onGenerate,
}) {
  return (
    <section className="admin-seating-panel">
      <header className="admin-seating-panel__header">
        <div>
          <h2>Sections</h2>
          <p>Create zones, pricing, and generated seat matrices.</p>
        </div>
        <Button size="sm" onClick={onCreate}>
          New section
        </Button>
      </header>

      {sections.length ? (
        <div className="admin-section-list">
          {sections.map((section) => {
            const seats = sectionSeatMap.get(section.id) || [];
            const stats = getSectionSeatStats(seats);
            const isSelected = section.id === selectedSectionId;
            return (
              <article
                className={`admin-section-card ${isSelected ? "admin-section-card--active" : ""}`}
                key={section.id}
              >
                <button type="button" className="admin-section-card__main" onClick={() => onSelect?.(section.id)}>
                  <span className={`seat-shape-icon ${getSeatShapeClassName(section.seatShape)}`} aria-hidden="true">
                    <span>{section.name?.slice(0, 2) || "S"}</span>
                  </span>
                  <span>
                    <strong>{section.name}</strong>
                    <small>{section.description || "No description."}</small>
                  </span>
                </button>
                <dl className="admin-section-card__stats">
                  <div>
                    <dt>Price</dt>
                    <dd title={formatCurrency(section.price)}>{formatCurrency(section.price)}</dd>
                  </div>
                  <div>
                    <dt>Seats</dt>
                    <dd>{stats.total || section.seatCount || section.capacity || 0}</dd>
                  </div>
                  <div>
                    <dt>Available</dt>
                    <dd>{stats.Available}</dd>
                  </div>
                  <div>
                    <dt>Sold</dt>
                    <dd>{stats.Sold}</dd>
                  </div>
                </dl>
                <div className="admin-section-card__badges">
                  <StatusBadge status="Available" /> <span>{stats.Available}</span>
                  <StatusBadge status="Locked" /> <span>{stats.Locked}</span>
                  <StatusBadge status="Released" /> <span>{stats.Released}</span>
                </div>
                <div className="admin-section-card__actions">
                  <Button size="sm" variant="outline" onClick={() => onGenerate?.(section)}>
                    Generate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEdit?.(section)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete?.(section)}>
                    Delete
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No sections yet"
          message="Create a section before generating seats for this event."
          action={<Button onClick={onCreate}>Create section</Button>}
        />
      )}
    </section>
  );
}
