import { Badge } from '../../components/ui/index.js';
import { RESERVATION_STATUS_LABELS, statusTone } from '../../services/format.js';

export const dayLabel = (day) => (day ? day.split('-').reverse().join('/') : '');
export const slotLabel = (slot) => `${slot.horaInicio}–${slot.horaFin}`;

export function ReservationStatusBadge({ estado }) {
  return <Badge tone={statusTone(estado)}>{RESERVATION_STATUS_LABELS[estado] || estado}</Badge>;
}

/** El backend trae `espacio` (nombre); `spaceName` cubre su ausencia. */
export const spaceOf = (row, spaceName) => row.espacio || spaceName(row.espacioId);

/** Columnas comunes de las listas de reservas (P10, P11 e inicio). */
export function reservationColumns(spaceName, extra = []) {
  return [
    { key: 'codigo', header: 'Código', render: (row) => <strong className="mono">{row.codigo}</strong> },
    { key: 'espacio', header: 'Espacio', render: (row) => spaceOf(row, spaceName) },
    { key: 'fecha', header: 'Fecha', render: (row) => dayLabel(row.fecha) },
    { key: 'franja', header: 'Horario', render: (row) => slotLabel(row) },
    { key: 'estado', header: 'Estado', render: (row) => <ReservationStatusBadge estado={row.estado} /> },
    ...extra,
  ];
}
