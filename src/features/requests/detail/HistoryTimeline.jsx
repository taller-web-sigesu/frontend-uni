import { formatDateTime, REQUEST_STATUS_LABELS } from '../../../services/format.js';

const label = (estado) => REQUEST_STATUS_LABELS[estado] || estado;

/** Transiciones en orden cronológico: estado anterior → nuevo, fecha, actor y motivo. */
export function HistoryTimeline({ items, personName }) {
  return (
    <section aria-labelledby="detalle-historial">
      <h2 id="detalle-historial">Historial</h2>
      {items.length === 0 ? (
        <p className="card__lead">Sin movimientos.</p>
      ) : (
        <ol className="timeline">
          {items.map((item, index) => {
            const actor = personName(item.actorId);
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
