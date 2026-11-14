import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { DataTable, EmptyState, ErrorState, Pagination, Skeleton } from '../../components/ui/index.js';
import { useCatalogLabels } from '../../services/catalogs.js';
import { countLabel } from '../../services/format.js';
import { useResource } from '../../services/useResource.js';
import { listRequests } from './requestsApi.js';
import { requestColumns } from './requestColumns.jsx';

export const PAGE_SIZE = 10;

function NewRequestLink() {
  return <Link className="btn btn--primary" to="/solicitudes/nueva">Registrar nueva solicitud</Link>;
}

/** P03: solicitudes propias del estudiante o docente, paginadas por el servidor. */
export default function MyRequestsPage() {
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
  else if (data.totalElements === 0) {
    content = <EmptyState title="Aún no tienes solicitudes registradas" action={<NewRequestLink />} />;
  } else {
    content = (
      <>
        <DataTable
          caption="Solicitudes registradas"
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
      <header className="page__header page__header--actions">
        <div>
          <h1>Mis solicitudes</h1>
          {data && <p className="page__lead">{countLabel(data.totalElements, 'registrada')}</p>}
        </div>
        <NewRequestLink />
      </header>
      {content}
    </section>
  );
}
