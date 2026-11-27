import { ErrorState, Skeleton } from '../../components/ui/index.js';
import { currentMonthInLima, limaDaysToUtcRange } from '../../services/format.js';
import { useResource } from '../../services/useResource.js';
import { getSummary } from '../dashboard/dashboardApi.js';
import { SummaryKpis } from '../dashboard/KpiCard.jsx';

export function AdminSummary() {
  const { desde, hasta } = currentMonthInLima();
  const { data, error, reload } = useResource(
    (signal) => getSummary(limaDaysToUtcRange(desde, hasta), signal),
    [desde, hasta],
  );

  return (
    <section className="home-section" aria-labelledby="resumen-admin">
      <header className="home-section__header">
        <div>
          <h2 id="resumen-admin">Indicadores del mes</h2>
          <p className="page__lead">Solicitudes de todas las áreas · Hora de Lima</p>
        </div>
      </header>
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && <SummaryKpis summary={data} variant="card" />}
      {!data && !error && <Skeleton lines={3} />}
    </section>
  );
}
