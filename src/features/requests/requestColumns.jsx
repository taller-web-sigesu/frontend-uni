import { Badge } from '../../components/ui/index.js';
import { formatDateTime, REQUEST_STATUS_LABELS, statusTone } from '../../services/format.js';

export function StatusBadge({ estado }) {
  return <Badge tone={statusTone(estado)}>{REQUEST_STATUS_LABELS[estado] || estado}</Badge>;
}

/** Columnas comunes de las listas de solicitudes (P03, P06 y P07). */
export function requestColumns({ categoryName, priorityName }, extra = []) {
  return [
    { key: 'codigo', header: 'Código', render: (row) => <strong className="mono">{row.codigo}</strong> },
    { key: 'categoria', header: 'Categoría', render: (row) => categoryName(row.categoriaId) },
    { key: 'prioridad', header: 'Prioridad', render: (row) => priorityName(row.prioridadId) },
    { key: 'estado', header: 'Estado', render: (row) => <StatusBadge estado={row.estado} /> },
    ...extra,
    { key: 'fecha', header: 'Fecha', render: (row) => formatDateTime(row.creadoEn) },
  ];
}
