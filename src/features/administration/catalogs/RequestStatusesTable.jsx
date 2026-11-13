import { useState } from 'react';
import {
  Button, DataTable, Dialog, ErrorState, Skeleton, TextField,
} from '../../../components/ui/index.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { listRequestStatuses, renameRequestStatus } from '../catalogsAdminApi.js';

function RenameForm({ status, onSaved, onCancel }) {
  const [nombre, setNombre] = useState(status.nombre);
  const [localError, setLocalError] = useState(null);
  const { submit, pending, error, fieldErrors } = useSubmit((value) => renameRequestStatus(status.id, value));

  async function handleSubmit(event) {
    event.preventDefault();
    const value = nombre.trim();
    if (!value) {
      setLocalError('Indica el nombre.');
      return;
    }
    setLocalError(null);
    if (value === status.nombre) {
      onCancel();
      return;
    }
    const result = await submit(value);
    if (result.ok) onSaved();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="card__lead">Código {status.codigo}: el código y las transiciones no cambian.</p>
      <TextField
        label="Nombre"
        name="nombre"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        error={localError || fieldErrors.nombre || (error && !fieldErrors.nombre ? error.detail : null)}
      />
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <Button type="submit" pending={pending}>Guardar</Button>
      </div>
    </form>
  );
}

/** Estados del flujo: solo se personaliza el nombre visible. */
export function RequestStatusesTable() {
  const [editing, setEditing] = useState(null);
  const { data, error, status, reload } = useResource((signal) => listRequestStatuses(signal), []);

  const columns = [
    { key: 'codigo', header: 'Código', render: (s) => <span className="mono">{s.codigo}</span> },
    { key: 'nombre', header: 'Nombre' },
    { key: 'esFinal', header: 'Final', render: (s) => (s.esFinal ? 'Sí' : 'No') },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (s) => <Button variant="ghost" onClick={() => setEditing(s)}>Editar nombre</Button>,
    },
  ];

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={5} />;
  else content = <DataTable caption="Estados de solicitud" columns={columns} rows={data} getRowKey={(s) => s.id} />;

  return (
    <>
      {content}
      <p className="field__hint">El código de cada estado está bloqueado; solo el nombre es editable.</p>
      <Dialog open={editing !== null} title="Editar nombre" onClose={() => setEditing(null)}>
        {editing && (
          <RenameForm
            key={editing.id}
            status={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Dialog>
    </>
  );
}
