export default function ErrorState({ title = "Something went wrong", message = "Try again or return to a safe page.", action }) {
  return (
    <section className="state state--error" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </section>
  );
}
