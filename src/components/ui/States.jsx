import { Button } from './Button.jsx';

export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton" role="status" aria-label="Cargando">
      {Array.from({ length: lines }, (_, index) => <span key={index} className="skeleton__line" />)}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="state state--empty">
      <p className="state__title">{title}</p>
      {description && <p className="state__description">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title">{error?.detail || 'No se pudo completar la operación.'}</p>
      {error?.correlationId && <p className="state__description">Código de rastreo: {error.correlationId}</p>}
      {onRetry && <Button variant="secondary" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}
