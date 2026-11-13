import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DataTable, EmptyState, ErrorState, Pagination, Skeleton } from '../../components/ui/index.js';
import { useCatalogLabels } from '../../services/catalogs.js';
import { useResource } from '../../services/useResource.js';
import { requestColumns } from '../requests/requestColumns.jsx';
import { listRequests } from '../requests/requestsApi.js';

const PAGE_SIZE = 10;

/**
 * P06: asignaciones vigentes del técnico. El servidor ya las ordena por
 * prioridad descendente y fecha ascendente; aquí no se reordenan.
 */
export default function TechnicianInboxPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const labels = useCatalogLabels();
  const { data, error, status, reload } = useResource(
    (signal) => listRequests({ page, size: PAGE_SIZE }, signal),
    [page],
  );

  let content;
  if (status === 'error') content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={5} />;
  else if (data.totalElements === 0) content = <EmptyState title="No tienes asignaciones vigentes" />;
  else {
    content = (
      <>
        <DataTable
          caption="Asignaciones vigentes"
          columns={requestColumns(labels)}
          rows={data.items}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/solicitudes/${row.id}`)}
        />
        <Pagination page={data.page} size={data.size} totalElements={data.totalElements} onChange={setPage} />
      </>
    );
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1>Mis asignaciones</h1>
        <p className="page__lead">Ordenadas por prioridad y antigüedad</p>
      </header>
      {content}
    </section>
  );
}
