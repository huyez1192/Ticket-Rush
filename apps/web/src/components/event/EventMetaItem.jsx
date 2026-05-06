export default function EventMetaItem({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="event-info-item">
      <span className="event-info-label">{label}</span>
      <span className="event-info-value">{value}</span>
    </div>
  );
}
