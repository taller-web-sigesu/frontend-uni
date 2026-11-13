import { useId } from 'react';

function useFieldIds(name) {
  const generated = useId();
  const id = `${name || 'campo'}-${generated}`;
  return { id, hintId: `${id}-hint`, errorId: `${id}-error` };
}

function describedBy(hint, error, hintId, errorId) {
  const ids = [hint ? hintId : null, error ? errorId : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

function FieldShell({ id, label, hint, hintId, error, errorId, children }) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="field__hint" id={hintId}>{hint}</p>}
      {error && <p className="field__error" id={errorId}>{error}</p>}
    </div>
  );
}

function controlProps(id, name, hint, error, hintId, errorId) {
  return {
    id,
    name,
    className: 'field__control',
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy(hint, error, hintId, errorId),
  };
}

export function TextField({ label, name, error, hint, type = 'text', ...props }) {
  const { id, hintId, errorId } = useFieldIds(name);
  return (
    <FieldShell id={id} label={label} hint={hint} hintId={hintId} error={error} errorId={errorId}>
      <input type={type} {...controlProps(id, name, hint, error, hintId, errorId)} {...props} />
    </FieldShell>
  );
}

export function TextArea({ label, name, error, hint, rows = 4, ...props }) {
  const { id, hintId, errorId } = useFieldIds(name);
  return (
    <FieldShell id={id} label={label} hint={hint} hintId={hintId} error={error} errorId={errorId}>
      <textarea rows={rows} {...controlProps(id, name, hint, error, hintId, errorId)} {...props} />
    </FieldShell>
  );
}

export function SelectField({ label, name, options = [], placeholder, error, hint, ...props }) {
  const { id, hintId, errorId } = useFieldIds(name);
  return (
    <FieldShell id={id} label={label} hint={hint} hintId={hintId} error={error} errorId={errorId}>
      <select {...controlProps(id, name, hint, error, hintId, errorId)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </FieldShell>
  );
}
