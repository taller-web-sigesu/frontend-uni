import { Badge } from '../../../components/ui/index.js';
import { formatDateTime } from '../../../services/format.js';
import { areaName } from '../../../services/pendingContract.js';
import { isTerminal } from '../availableActions.js';

export const SLA_LABELS = {
  EN_PLAZO: 'En plazo',
  POR_VENCER: 'Por vencer',
  VENCIDA: 'Vencida',
  CERRADA: 'Cerrada',
  SIN_SLA: 'Sin SLA',
};
const SLA_TONES = { EN_PLAZO: 'success', POR_VENCER: 'warning', VENCIDA: 'danger' };

export function SlaBadge({ sla }) {
  if (!sla?.estado) return null;
  return <Badge tone={SLA_TONES[sla.estado] || 'neutral'}>SLA: {SLA_LABELS[sla.estado] || sla.estado}</Badge>;
}

function Item({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Datos de la solicitud (P05). En terminales se muestra el último responsable. */
export function RequestSummary({ solicitud, categoryName }) {
  const terminal = isTerminal(solicitud.estado);
  const responsable = terminal ? solicitud.ultimoResponsable : solicitud.responsableActual;
  const { sla } = solicitud;
  return (
    <section className="card" aria-labelledby="detalle-datos">
      <h2 id="detalle-datos">Datos de la solicitud</h2>
      <dl className="data-list data-list--grid">
        <Item label="Categoría">{categoryName(solicitud.categoriaId)}</Item>
        <Item label="Área">{solicitud.area || areaName(solicitud.areaId)}</Item>
        <Item label="Ubicación">{solicitud.ubicacion}</Item>
        <Item label="Solicitante">{solicitud.solicitante?.nombreCompleto}</Item>
        <Item label={terminal ? 'Último responsable' : 'Responsable'}>{responsable?.nombreCompleto || 'Sin asignar'}</Item>
        <Item label="Fecha de registro">{formatDateTime(solicitud.creadoEn)}</Item>
        {sla?.fechaAviso && <Item label="Aviso de SLA">{formatDateTime(sla.fechaAviso)}</Item>}
        {sla?.fechaLimite && <Item label="Límite de SLA">{formatDateTime(sla.fechaLimite)}</Item>}
      </dl>
      <h3 className="card__subtitle">Descripción</h3>
      <p className="card__text">{solicitud.descripcion}</p>
    </section>
  );
}
