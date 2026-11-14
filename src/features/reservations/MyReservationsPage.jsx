import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { DataTable, EmptyState, ErrorState, Pagination, SelectField, Skeleton, TextField } from '../../components/ui/index.js';
import { RESERVATION_STATUS_LABELS } from '../../services/format.js';
import { useResource } from '../../services/useResource.js';
import { reservationColumns } from './reservationColumns.jsx';
import { listReservations } from './reservationsApi.js';
import { useSpaceNames } from './useSpaceNames.js';

export const PAGE_SIZE = 10;
const STATUS_OPTIONS = Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => ({ value, label }));

function NewReservationLink() {
  return <Link className="btn btn--primary" to="/reservas/nueva">Registrar reserva</Link>;
}

/** P10: reservas propias con filtros de estado y fechas (extremos incluidos). */
export default function MyReservationsPage() {
  const navigate = useNavigate();
  const { spaceName } = useSpaceNames();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ estado: '', fechaDesde: '', fechaHasta: '' });
  const { data, error, status, reload } = useResource(
    (signal) => listReservations({ ...filters, page, size: PAGE_SIZE }, signal),
    [filters.estado, filters.fechaDesde, filters.fechaHasta, page],
  );
  const filtered = Boolean(filters.estado || filters.fechaDesde || filters.fechaHasta);

  // Cambiar un filtro vuelve a la primera página.
  const setFilter = (field) => (event) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={5} />;
  else if (data.totalElements === 0) {
    content = filtered
      ? <EmptyState title="No hay reservas con esos filtros" />
      : <EmptyState title="Aún no tienes reservas registradas" action={<NewReservationLink />} />;
  } else {
    content = (
      <>
        {status === 'error' && <ErrorState error={error} onRetry={reload} />}
        <DataTable
          caption="Reservas registradas"
          columns={reservationColumns(spaceName)}
          rows={data.items}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/reservas/${row.id}`)}
        />
        <Pagination page={data.page} size={data.size} totalElements={data.totalElements} onChange={setPage} />
      </>
    );
  }

  return (
    <section className="page">
      <header className="page__header page__header--actions">
        <div>
          <h1>Mis reservas</h1>
          {data && <p className="page__lead">{data.totalElements} reservas</p>}
        </div>
        <NewReservationLink />
      </header>
      <div className="filters">
        <SelectField label="Estado" name="estado" placeholder="Todos" options={STATUS_OPTIONS} value={filters.estado} onChange={setFilter('estado')} />
        <TextField label="Desde" name="fechaDesde" type="date" value={filters.fechaDesde} onChange={setFilter('fechaDesde')} />
        <TextField label="Hasta" name="fechaHasta" type="date" min={filters.fechaDesde || undefined} value={filters.fechaHasta} onChange={setFilter('fechaHasta')} />
      </div>
      {content}
    </section>
  );
}
