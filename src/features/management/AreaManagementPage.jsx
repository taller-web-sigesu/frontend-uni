import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Button, DataTable, EmptyState, ErrorState, Pagination, SelectField, Skeleton,
} from '../../components/ui/index.js';
import { useCatalogLabels } from '../../services/catalogs.js';
import { countLabel, REQUEST_STATUS_LABELS } from '../../services/format.js';
import { listPriorityOptions } from '../../services/pendingContract.js';
import { useResource } from '../../services/useResource.js';
import { requestColumns } from '../requests/requestColumns.jsx';
import { listRequests } from '../requests/requestsApi.js';

const PAGE_SIZE = 10;
const NO_FILTERS = { estado: '', categoriaId: '', prioridadId: '' };
const STATUS_OPTIONS = Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({ value, label }));

/**
 * P07: solicitudes del área del supervisor con filtros del servidor. Cambiar
 * un filtro vuelve a la página 0; una respuesta de un filtro anterior se descarta.
 */
export default function AreaManagementPage() {
  const navigate = useNavigate();
  const labels = useCatalogLabels();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(0);
  const { data: priorities } = useResource(() => listPriorityOptions(), []);
  const { data, error, status, reload } = useResource(
    (signal) => listRequests({ page, size: PAGE_SIZE, ...filters }, signal),
    [page, filters.estado, filters.categoriaId, filters.prioridadId],
  );

  const setFilter = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
    setPage(0);
  };
  const filtered = Object.values(filters).some(Boolean);

  let content;
  if (status === 'error') content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={5} />;
  else if (data.totalElements === 0) {
    content = <EmptyState title={filtered ? 'Ninguna solicitud coincide con los filtros' : 'El área no tiene solicitudes'} />;
  } else {
    content = (
      <>
        <DataTable
          caption="Solicitudes del área"
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
        <h1>Gestión de área</h1>
        {data && (
          <p className="page__lead">
            {countLabel(data.totalElements, 'solicitud')}{filtered ? ' con estos filtros' : ''}
          </p>
        )}
      </header>
      <div className="filters" role="search" aria-label="Filtros de solicitudes">
        <SelectField label="Estado" name="estado" placeholder="Todos" options={STATUS_OPTIONS} value={filters.estado} onChange={setFilter('estado')} />
        <SelectField
          label="Categoría"
          name="categoriaId"
          placeholder="Todas"
          options={labels.categories.map((c) => ({ value: c.id, label: c.nombre }))}
          value={filters.categoriaId}
          onChange={setFilter('categoriaId')}
        />
        {priorities && (
          <SelectField
            label="Prioridad"
            name="prioridadId"
            placeholder="Todas"
            options={priorities.map((p) => ({ value: p.id, label: p.nombre }))}
            value={filters.prioridadId}
            onChange={setFilter('prioridadId')}
          />
        )}
        <Button
          variant="ghost"
          disabled={!filtered}
          onClick={() => {
            setFilters(NO_FILTERS);
            setPage(0);
          }}
        >
          Limpiar
        </Button>
      </div>
      {content}
    </section>
  );
}
