import { useState } from 'react';
import { Button, Dialog, ErrorState, Skeleton, Tabs } from '../../../components/ui/index.js';
import { useResource } from '../../../services/useResource.js';
import { CatalogTable } from '../catalogs/CatalogTable.jsx';
import {
  createSpace, createSpaceType, listAreas, listSpaces, listSpaceTypes, updateSpace, updateSpaceType,
} from '../spacesAdminApi.js';
import { PolicyForm } from './PolicyForm.jsx';
import { ScheduleEditor } from './ScheduleEditor.jsx';

const SPACES_API = { list: listSpaces, create: createSpace, update: updateSpace };
const TYPES_API = { list: listSpaceTypes, create: createSpaceType, update: updateSpaceType };

const code = { key: 'codigo', header: 'Código', render: (r) => <span className="mono">{r.codigo}</span> };
const name = { key: 'nombre', header: 'Nombre' };
const codeField = { name: 'codigo', label: 'Código', required: true, createOnly: true };
const nameField = { name: 'nombre', label: 'Nombre', required: true };

async function loadRefs(signal) {
  const [types, areas] = await Promise.all([listSpaceTypes({ page: 0, size: 100 }, signal), listAreas(signal)]);
  return { types: types.items, areas };
}

/** Espacios: formulario del contrato y horario semanal por fila. */
function SpacesTab() {
  const { data: refs, error, reload } = useResource((signal) => loadRefs(signal), []);
  const [scheduling, setScheduling] = useState(null);
  const [notice, setNotice] = useState(null);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!refs) return <Skeleton lines={5} />;
  const nameOf = (list, id) => (id ? list.find((item) => item.id === id)?.nombre ?? id : '—');
  const active = (list) => list.filter((item) => item.activo).map((item) => ({ value: item.id, label: item.nombre }));
  return (
    <>
      {notice && <p className="notice notice--success" role="status">{notice}</p>}
      <CatalogTable
        api={SPACES_API}
        singular="espacio"
        gender="m"
        caption="Espacios"
        columns={[
          code,
          name,
          { key: 'tipoEspacioId', header: 'Tipo', render: (r) => nameOf(refs.types, r.tipoEspacioId) },
          { key: 'pabellon', header: 'Pabellón', render: (r) => r.pabellon || '—' },
          { key: 'capacidad', header: 'Capacidad' },
        ]}
        fields={[
          codeField,
          nameField,
          { name: 'tipoEspacioId', label: 'Tipo de espacio', type: 'select', required: true, article: 'un tipo', options: active(refs.types) },
          { name: 'capacidad', label: 'Capacidad', type: 'number', required: true, positive: true, hint: 'Número de personas; mayor que cero.' },
          { name: 'areaId', label: 'Área (opcional)', type: 'select', placeholder: 'Sin área (decide el administrador)', options: active(refs.areas) },
          { name: 'pabellon', label: 'Pabellón (opcional)' },
          { name: 'piso', label: 'Piso (opcional)' },
          { name: 'descripcion', label: 'Descripción (opcional)', type: 'textarea' },
          { name: 'ubicacionDetallada', label: 'Ubicación detallada (opcional)' },
        ]}
        rowActions={(r) => <Button variant="ghost" onClick={() => setScheduling(r)}>Horario</Button>}
      />
      <Dialog open={scheduling !== null} title={scheduling ? `Horario de ${scheduling.nombre}` : ''} onClose={() => setScheduling(null)}>
        {scheduling && (
          <ScheduleEditor
            key={scheduling.id}
            spaceId={scheduling.id}
            onCancel={() => setScheduling(null)}
            onSaved={() => {
              setNotice(`Horario de ${scheduling.nombre} guardado`);
              setScheduling(null);
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function SpaceTypesTab() {
  return (
    <CatalogTable
      api={TYPES_API}
      singular="tipo de espacio"
      gender="m"
      caption="Tipos de espacio"
      columns={[code, name, { key: 'descripcion', header: 'Descripción', render: (r) => r.descripcion || '—' }]}
      fields={[codeField, nameField, { name: 'descripcion', label: 'Descripción (opcional)', type: 'textarea' }]}
    />
  );
}

/** P15: espacios, tipos de espacio y política de reservas. Bajas lógicas; el código no cambia. */
export default function SpacesAdminPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h1>Espacios y horarios</h1>
        <p className="page__lead">Espacios, horario semanal, tipos y política de reservas</p>
      </header>
      <Tabs
        label="Administración de ambientes"
        tabs={[
          { id: 'espacios', label: 'Espacios', render: () => <SpacesTab /> },
          { id: 'tipos', label: 'Tipos de espacio', render: () => <SpaceTypesTab /> },
          { id: 'politica', label: 'Política de reservas', render: () => <PolicyForm /> },
        ]}
      />
    </section>
  );
}
