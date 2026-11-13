import { useCallback, useState } from 'react';
import { useCurrentUser } from '../../app/userContext.js';
import { Button, ErrorState, SelectField, Skeleton } from '../../components/ui/index.js';
import { useCatalogLabels } from '../../services/catalogs.js';
import { downloadBlob } from '../../services/download.js';
import { currentMonthInLima, limaDaysToUtcRange } from '../../services/format.js';
import { areaName, priorityName } from '../../services/pendingContract.js';
import { useResource } from '../../services/useResource.js';
import { useSubmit } from '../../services/useSubmit.js';
import { listAll } from '../administration/catalogsAdminApi.js';
import { listUsers } from '../administration/usersApi.js';
import { BarList } from './BarList.jsx';
import { DateRangeFilter } from './DateRangeFilter.jsx';
import { KpiCard } from './KpiCard.jsx';
import { downloadReport, getSummary } from './dashboardApi.js';

const dayLabel = (day) => day.split('-').reverse().join('/');
const nameIn = (list, id) => list?.find((item) => item.id === id)?.nombre;

/** El administrador lee los catálogos completos (incluye inactivos) y los usuarios. */
async function loadAdminNames(signal) {
  const [areas, categories, priorities, users] = await Promise.all([
    listAll('areas', signal),
    listAll('categories', signal),
    listAll('priorities', signal),
    listUsers({ page: 0, size: 100 }, signal).then((page) => page.items),
  ]);
  return { areas, categories, priorities, users };
}

/** Nombres para los ids del resumen: catálogos del admin, o los del supervisor con respaldo. */
function useNames(isAdmin) {
  const { categoryName } = useCatalogLabels();
  const { data: admin } = useResource((signal) => (isAdmin ? loadAdminNames(signal) : null), [isAdmin]);
  return {
    areas: admin?.areas.filter((a) => a.activo) || [],
    area: useCallback((id) => nameIn(admin?.areas, id) ?? areaName(id), [admin]),
    category: useCallback(
      (id) => (isAdmin ? nameIn(admin?.categories, id) ?? `Categoría ${id}` : categoryName(id)),
      [admin, isAdmin, categoryName],
    ),
    priority: useCallback((id) => nameIn(admin?.priorities, id) ?? priorityName(id), [admin]),
    person: useCallback((id) => {
      if (id === null || id === undefined) return 'Sin asignar';
      return admin?.users.find((u) => u.id === id)?.nombreCompleto ?? `Responsable ${id}`;
    }, [admin]),
  };
}

/** El backend trae `nombre` en cada grupo; los catálogos solo cubren su ausencia. */
const toItems = (groups, label) => groups.map((g) => ({
  key: g.id ?? 'ninguno',
  label: g.id === null || g.id === undefined ? label(null) : g.nombre || label(g.id),
  value: g.total,
}));

/**
 * P08: indicadores del rango aplicado (mes actual de Lima al entrar). El rango
 * en edición no recarga ni se exporta hasta «Aplicar».
 */
export default function DashboardPage() {
  const user = useCurrentUser();
  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const names = useNames(isAdmin);
  const [applied, setApplied] = useState(() => currentMonthInLima());
  const [areaId, setAreaId] = useState('');
  const filters = { ...limaDaysToUtcRange(applied.desde, applied.hasta), areaId: isAdmin ? areaId || undefined : undefined };
  const { data, error, status, reload } = useResource(
    (signal) => getSummary(filters, signal),
    [filters.fechaDesde, filters.fechaHasta, filters.areaId],
  );
  const exportRequests = useSubmit(() => downloadReport({ tipo: 'solicitudes', ...filters }).then(downloadBlob));
  const exportIndicators = useSubmit(() => downloadReport({ tipo: 'indicadores', ...filters }).then(downloadBlob));
  const exportError = exportRequests.error || exportIndicators.error;

  const scope = isAdmin
    ? (areaId ? `Área: ${names.area(areaId)}` : 'Todas las áreas')
    : `Área: ${names.area(user?.areaId)}`;

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={6} />;
  else {
    const { vencidas } = data;
    content = (
      <>
        {status === 'error' && <ErrorState error={error} onRetry={reload} />}
        <div className="kpi-strip">
          <KpiCard label="Registradas" value={data.registradas} />
          <KpiCard label="Pendientes" value={data.pendientes} />
          <KpiCard label="Atendidas" value={data.atendidas} />
        </div>
        <div className="kpi-grid">
          <KpiCard
            variant="card"
            label="Promedio de atención"
            value={`${Number(data.promedioHorasAtencion).toFixed(1)} h`}
            note="En el rango seleccionado"
          />
          <KpiCard
            variant="card"
            label="Porcentaje resueltas"
            value={`${Number(data.porcentajeResueltas).toFixed(1)} %`}
            note={`${data.atendidas} de ${data.registradas} solicitudes`}
          />
          {vencidas?.disponible ? (
            <KpiCard variant="card" label="Vencidas" value={vencidas.total} note={`${vencidas.porVencer} por vencer`} />
          ) : (
            <KpiCard variant="card" label="Vencidas" value="No disponible" note="Se habilita al activar el módulo de SLA" />
          )}
        </div>
        <div className="kpi-grid">
          <BarList
            title="Por categoría"
            description="Solicitudes registradas por categoría"
            items={toItems(data.porCategoria, names.category)}
          />
          <BarList title="Por prioridad" description="Distribución por prioridad" items={toItems(data.porPrioridad, names.priority)} />
          <BarList title="Por responsable" description="Carga por técnico" items={toItems(data.porResponsable, names.person)} />
        </div>
      </>
    );
  }

  return (
    <section className="page">
      <header className="page__header page__header--actions">
        <div>
          <h1>Indicadores</h1>
          <p className="page__lead">{dayLabel(applied.desde)} – {dayLabel(applied.hasta)} · {scope}</p>
        </div>
        <div className="dashboard-export">
          <Button variant="secondary" pending={exportRequests.pending} onClick={() => exportRequests.submit()}>
            Exportar solicitudes (CSV)
          </Button>
          <Button variant="secondary" pending={exportIndicators.pending} onClick={() => exportIndicators.submit()}>
            Exportar indicadores (CSV)
          </Button>
        </div>
      </header>
      {exportError && <p className="form-error" role="alert">{exportError.detail}</p>}
      <div className="filters">
        <DateRangeFilter value={applied} onApply={setApplied} />
        {isAdmin && (
          <SelectField
            label="Área"
            name="areaId"
            placeholder="Todas las áreas"
            options={names.areas.map((a) => ({ value: a.id, label: a.nombre }))}
            value={areaId}
            onChange={(event) => setAreaId(event.target.value)}
          />
        )}
      </div>
      {content}
    </section>
  );
}
