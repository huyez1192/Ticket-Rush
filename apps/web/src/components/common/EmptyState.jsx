export default function EmptyState({ title = "Nothing here yet", message = "There is no data to show.", action }) {
  return (
    <section className="state">
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </section>
  );
}
