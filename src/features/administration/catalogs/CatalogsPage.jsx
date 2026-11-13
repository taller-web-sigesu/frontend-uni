import { ErrorState, Skeleton, Tabs } from '../../../components/ui/index.js';
import { useResource } from '../../../services/useResource.js';
import { listAll } from '../catalogsAdminApi.js';
import { CatalogTable } from './CatalogTable.jsx';
import { RequestStatusesTable } from './RequestStatusesTable.jsx';

const code = { key: 'codigo', header: 'Código', render: (r) => <span className="mono">{r.codigo}</span> };
const name = { key: 'nombre', header: 'Nombre' };
const codeField = { name: 'codigo', label: 'Código', required: true, createOnly: true };
const nameField = { name: 'nombre', label: 'Nombre', required: true };
const descriptionField = { name: 'descripcion', label: 'Descripción (opcional)', type: 'textarea' };

function AreasTab() {
  return (
    <CatalogTable
      kind="areas"
      singular="área"
      caption="Áreas"
      columns={[code, name, { key: 'descripcion', header: 'Descripción', render: (r) => r.descripcion || '—' }]}
      fields={[codeField, nameField, descriptionField]}
    />
  );
}

/** Las categorías referencian áreas y prioridades: solo se ofrecen las activas. */
function CategoriesTab() {
  const { data: refs, error, reload } = useResource(async (signal) => {
    const [areas, priorities] = await Promise.all([listAll('areas', signal), listAll('priorities', signal)]);
    return { areas, priorities };
  }, []);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!refs) return <Skeleton lines={5} />;
  const nameOf = (list, id) => list.find((item) => item.id === id)?.nombre ?? id;
  const active = (list) => list.filter((item) => item.activo).map((item) => ({ value: item.id, label: item.nombre }));
  return (
    <CatalogTable
      kind="categories"
      singular="categoría"
      caption="Categorías"
      columns={[
        code,
        name,
        { key: 'areaId', header: 'Área', render: (r) => nameOf(refs.areas, r.areaId) },
        { key: 'prioridadPredeterminadaId', header: 'Prioridad predeterminada', render: (r) => nameOf(refs.priorities, r.prioridadPredeterminadaId) },
      ]}
      fields={[
        codeField,
        nameField,
        { name: 'areaId', label: 'Área', type: 'select', required: true, article: 'un área', options: active(refs.areas) },
        {
          name: 'prioridadPredeterminadaId',
          label: 'Prioridad predeterminada',
          type: 'select',
          required: true,
          article: 'una prioridad',
          options: active(refs.priorities),
        },
        descriptionField,
      ]}
    />
  );
}

function PrioritiesTab() {
  return (
    <CatalogTable
      kind="priorities"
      singular="prioridad"
      caption="Prioridades"
      columns={[
        code,
        name,
        { key: 'nivel', header: 'Nivel' },
        {
          key: 'color',
          header: 'Color',
          render: (r) => (r.color ? (
            <span className="color-chip"><span className="color-chip__swatch" style={{ background: r.color }} aria-hidden="true" />{r.color}</span>
          ) : '—'),
        },
      ]}
      fields={[
        codeField,
        nameField,
        { name: 'nivel', label: 'Nivel', type: 'number', required: true, hint: 'Número entero; mayor nivel = más urgente.' },
        { name: 'color', label: 'Color (opcional)', hint: 'Por ejemplo #F5A623.' },
      ]}
    />
  );
}

/** P13: áreas, categorías, prioridades y estados. Bajas lógicas; el código no cambia. */
export default function CatalogsPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h1>Catálogos</h1>
        <p className="page__lead">Áreas, categorías, prioridades y estados</p>
      </header>
      <Tabs
        label="Catálogos"
        tabs={[
          { id: 'areas', label: 'Áreas', render: () => <AreasTab /> },
          { id: 'categorias', label: 'Categorías', render: () => <CategoriesTab /> },
          { id: 'prioridades', label: 'Prioridades', render: () => <PrioritiesTab /> },
          { id: 'estados', label: 'Estados', render: () => <RequestStatusesTable /> },
        ]}
      />
    </section>
  );
}
