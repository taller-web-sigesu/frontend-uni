import { useState } from 'react';
import { DataTable, ErrorState, Pagination, Skeleton } from '../../../components/ui/index.js';
import { formatDateTime } from '../../../services/format.js';
import { useResource } from '../../../services/useResource.js';
import { listAuditEvents } from '../../requests/requestsApi.js';

const PAGE_SIZE = 10;

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
            { key: 'campo', header: 'Campo' },
            { key: 'valorAnterior', header: 'Valor anterior', render: (row) => row.valorAnterior ?? '—' },
            { key: 'valorNuevo', header: 'Valor nuevo', render: (row) => row.valorNuevo ?? '—' },
            { key: 'actor', header: 'Actor', render: (row) => personName(row.actorId) || `Usuario ${row.actorId}` },
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
