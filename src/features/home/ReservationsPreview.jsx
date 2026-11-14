import { Link, useNavigate } from 'react-router';
import { DataTable, EmptyState, ErrorState, Skeleton } from '../../components/ui/index.js';
import { todayInLima } from '../../services/format.js';
import { useResource } from '../../services/useResource.js';
import { reservationColumns } from '../reservations/reservationColumns.jsx';
import { listReservations } from '../reservations/reservationsApi.js';
import { useSpaceNames } from '../reservations/useSpaceNames.js';

const PREVIEW_SIZE = 3;
const ACTIVE = ['PENDIENTE', 'CONFIRMADA'];

/**
 * Las propias vienen de la más lejana a la más cercana: se piden las de hoy
 * en adelante y se toman las 3 activas más próximas.
 */
async function loadUpcoming(signal) {
  const page = await listReservations({ fechaDesde: todayInLima(), page: 0, size: 50 }, signal);
  return page.items
    .filter((r) => ACTIVE.includes(r.estado))
    .sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`))
    .slice(0, PREVIEW_SIZE);
}

/** Sección del inicio: próximas reservas propias (estudiante, docente y técnico). */
export function ReservationsPreview({ user }) {
  const navigate = useNavigate();
  const { spaceName } = useSpaceNames();
  const { data, error, status, reload } = useResource((signal) => loadUpcoming(signal), [user.id]);

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={2} />;
  else if (data.length === 0) content = <EmptyState title="No tienes reservas próximas" />;
  else {
    content = (
      <DataTable
        columns={reservationColumns(spaceName)}
        rows={data}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/reservas/${row.id}`)}
      />
    );
  }

  return (
    <section className="home-section" aria-labelledby="inicio-reservas">
      <header className="home-section__header">
        <h2 id="inicio-reservas">Próximas reservas</h2>
        <div className="home-section__actions">
          <Link to="/reservas">Ver todas</Link>
          <Link className="btn btn--primary" to="/reservas/nueva">Registrar reserva</Link>
        </div>
      </header>
      {content}
    </section>
  );
}
