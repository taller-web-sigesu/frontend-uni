import { Link, useNavigate } from 'react-router';
import { DataTable, EmptyState, ErrorState, Skeleton } from '../../components/ui/index.js';
import { useCatalogLabels } from '../../services/catalogs.js';
import { useResource } from '../../services/useResource.js';
import { requestColumns } from '../requests/requestColumns.jsx';
import { listRequests } from '../requests/requestsApi.js';

const PREVIEW_SIZE = 5;

/**
 * Sección del inicio: las 5 solicitudes más recientes del estudiante o docente,
 * o las 5 primeras asignaciones del técnico (en el orden del servidor).
 */
export function RequestsPreview({ user }) {
  const navigate = useNavigate();
  const labels = useCatalogLabels();
  const isTechnician = user.rol === 'TECNICO';
  const { data, error, status, reload } = useResource(
    (signal) => listRequests({ page: 0, size: PREVIEW_SIZE }, signal),
    [user.id],
  );
  const title = isTechnician ? 'Mis asignaciones' : 'Últimas solicitudes';
  const listPath = isTechnician ? '/bandeja' : '/solicitudes';

  let content;
  if (status === 'error') content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={3} />;
  else if (data.totalElements === 0) {
    content = (
      <EmptyState title={isTechnician ? 'No tienes asignaciones vigentes' : 'Aún no tienes solicitudes registradas'} />
    );
  } else {
    content = (
      <DataTable
        columns={requestColumns(labels)}
        rows={data.items}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/solicitudes/${row.id}`)}
      />
    );
  }

  return (
    <section className="home-section" aria-labelledby="inicio-solicitudes">
      <header className="home-section__header">
        <h2 id="inicio-solicitudes">{title}</h2>
        <div className="home-section__actions">
          <Link to={listPath}>Ver todas</Link>
          {!isTechnician && <Link className="btn btn--primary" to="/solicitudes/nueva">Registrar nueva solicitud</Link>}
        </div>
      </header>
      {content}
    </section>
  );
}
