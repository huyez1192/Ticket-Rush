import Button from "./Button";

export default function IconButton({ label, children, className = "", ...props }) {
  return (
    <Button aria-label={label} title={label} className={`icon-btn ${className}`.trim()} {...props}>
      {children}
    </Button>
  );
}
