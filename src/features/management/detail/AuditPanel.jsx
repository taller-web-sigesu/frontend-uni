import { useState } from 'react';
import { DataTable, ErrorState, Pagination, Skeleton } from '../../../components/ui/index.js';
import { formatDateTime, REQUEST_STATUS_LABELS } from '../../../services/format.js';
import { useResource } from '../../../services/useResource.js';
import { listAuditEvents } from '../../requests/requestsApi.js';

const PAGE_SIZE = 10;

const ACTION_LABELS = {
  CREAR: 'Creación',
  ACTUALIZAR: 'Actualización',
  ASIGNAR: 'Asignación',
  REASIGNAR: 'Reasignación',
  CAMBIAR_ESTADO: 'Cambio de estado',
  ADJUNTAR: 'Adjuntar',
  ELIMINAR_ADJUNTO: 'Eliminar adjunto',
  COMENTAR: 'Comentario',
};

const FIELD_LABELS = {
  estado: 'Estado',
  prioridad: 'Prioridad',
  responsable: 'Responsable',
  nombre_original: 'Nombre del archivo',
  calificacion: 'Calificación',
  comentario: 'Comentario',
  rol: 'Rol',
  correo: 'Correo',
  areaId: 'Área',
  activo: 'Activo',
};

const isComment = (row) => row.entidad === 'comentarios' || row.accion === 'COMENTAR';
const actionLabel = (row) => {
  if (row.accion === 'CREAR' && isComment(row)) return 'Comentario';
  return ACTION_LABELS[row.accion] || row.accion || '—';
};
const fieldLabel = (row) => {
  if (row.campo) return FIELD_LABELS[row.campo] || row.campo;
  return isComment(row) ? 'Comentario' : '—';
};
const valueLabel = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return REQUEST_STATUS_LABELS[value] || value;
};

/** Modificaciones auditadas (solo supervisor del área). `reloadKey` la refresca tras un cambio. */
export function AuditPanel({ requestId, personName = () => null, reloadKey = 0 }) {
  const [page, setPage] = useState(0);
  const { data, error, status, reload } = useResource(
    (signal) => listAuditEvents(requestId, { page, size: PAGE_SIZE }, signal),
    [requestId, page, reloadKey],
  );

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={3} />;
  else if (data.totalElements === 0) content = <p className="card__lead">Sin cambios auditados.</p>;
  else {
    content = (
      <>
        <DataTable
          columns={[
            { key: 'accion', header: 'Acción', render: (row) => actionLabel(row) },
            { key: 'campo', header: 'Campo', render: (row) => fieldLabel(row) },
            { key: 'valorAnterior', header: 'Valor anterior', render: (row) => valueLabel(row.valorAnterior) },
            { key: 'valorNuevo', header: 'Valor nuevo', render: (row) => valueLabel(row.valorNuevo) },
            { key: 'actor', header: 'Actor', render: (row) => row.actorNombre || personName(row.actorId) || `Usuario ${row.actorId}` },
            { key: 'fecha', header: 'Fecha', render: (row) => formatDateTime(row.fecha) },
          ]}
          rows={data.items}
          getRowKey={(row) => row.id}
        />
        {data.totalElements > PAGE_SIZE && (
          <Pagination page={data.page} size={data.size} totalElements={data.totalElements} onChange={setPage} />
        )}
      </>
    );
  }

  return (
    <section className="card" aria-labelledby="detalle-auditoria">
      <h2 id="detalle-auditoria">Auditoría</h2>
      {content}
    </section>
  );
}
