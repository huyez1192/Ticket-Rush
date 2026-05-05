export default function Input({ label, helper, error, className = "", id, ...props }) {
  const inputId = id || props.name;

  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      {label ? <span className="field__label">{label}</span> : null}
      <input
        id={inputId}
        className={`field__control ${error ? "field__control--error" : ""}`.trim()}
        {...props}
      />
      {error ? <span className="field__error">{error}</span> : null}
      {helper && !error ? <span className="field__helper">{helper}</span> : null}
    </label>
  );
}
