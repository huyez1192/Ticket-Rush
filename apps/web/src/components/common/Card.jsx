export default function Card({ title, children, footer, tinted = false, className = "" }) {
  return (
    <section className={`card ${tinted ? "card--tinted" : ""} ${className}`.trim()}>
      {title ? (
        <header className="card__header">
          <h3>{title}</h3>
        </header>
      ) : null}
      {children}
      {footer ? <footer>{footer}</footer> : null}
    </section>
  );
}
