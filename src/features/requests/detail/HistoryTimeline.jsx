import { formatDateTime, REQUEST_STATUS_LABELS } from '../../../services/format.js';

/**
 * Transiciones en orden cronológico: estado anterior → nuevo, fecha, actor y
 * motivo. `labels` traduce los códigos (solicitudes por defecto; reservas en la fase 05).
 */
export function HistoryTimeline({ items, personName, labels = REQUEST_STATUS_LABELS }) {
  const label = (estado) => labels[estado] || estado;
  return (
    <section aria-labelledby="detalle-historial">
      <h2 id="detalle-historial">Historial</h2>
      {items.length === 0 ? (
        <p className="card__lead">Sin movimientos.</p>
      ) : (
        <ol className="timeline">
          {items.map((item, index) => {
            // La API ya envía el nombre del actor; `personName` cubre datos simulados antiguos.
            const actor = item.actorNombre || personName(item.actorId);
            return (
              // El historial no trae id propio; su orden no cambia.
              <li key={`${item.fecha}-${index}`} className="timeline__item">
                <span className="timeline__status">
                  {item.estadoAnterior ? `${label(item.estadoAnterior)} → ${label(item.estado)}` : label(item.estado)}
                </span>
                <span className="timeline__meta">
                  {formatDateTime(item.fecha)}{actor ? ` · ${actor}` : ''}
                </span>
                {item.motivo && <span className="timeline__reason">Motivo: {item.motivo}</span>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
