export function Button({ variant = 'primary', pending = false, disabled, type = 'button', className = '', children, ...props }) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`.trim()}
      disabled={disabled || pending}
      aria-busy={pending ? 'true' : undefined}
      {...props}
    >
      {children}
    </button>
  );
}
