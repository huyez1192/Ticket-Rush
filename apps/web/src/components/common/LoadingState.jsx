export default function LoadingState({ title = "Loading", message = "Fetching the latest information." }) {
  return (
    <section className="state" aria-live="polite">
      <div className="loading-bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </section>
  );
}
