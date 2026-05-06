import Button from "./Button";

export default function Modal({ title, children, isOpen, onClose, actions }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal" role="presentation" onMouseDown={onClose}>
      <section className="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal__header">
          <h2 id="modal-title">{title}</h2>
        </header>
        <div className="modal__content">{children}</div>
        {actions !== null ? (
          <footer className="modal__footer">{actions === undefined ? <Button onClick={onClose}>Close</Button> : actions}</footer>
        ) : null}
      </section>
    </div>
  );
}
