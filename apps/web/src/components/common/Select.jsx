export default function Select({ label, helper, error, options = [], className = "", id, children, ...props }) {
  const inputId = id || props.name;

  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      {label ? <span className="field__label">{label}</span> : null}
      <select
        id={inputId}
        className={`field__control ${error ? "field__control--error" : ""}`.trim()}
        {...props}
      >
        {children ||
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
      {error ? <span className="field__error">{error}</span> : null}
      {helper && !error ? <span className="field__helper">{helper}</span> : null}
    </label>
  );
}
