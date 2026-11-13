import { useState } from 'react';
import { Button, Dialog, SelectField, Skeleton } from '../../../components/ui/index.js';
import { listPriorityOptions } from '../../../services/pendingContract.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { assign, listEligibleTechnicians } from '../../requests/requestsApi.js';
import { CONFLICT_MESSAGE, isConflict, needsReload } from './conflict.js';

async function loadOptions(requestId, signal) {
  const [technicians, priorities] = await Promise.all([
    listEligibleTechnicians(requestId, signal),
    listPriorityOptions(),
  ]);
  return { technicians: technicians.items, priorities };
}

function AssignForm({ solicitud, onDone, onConflict, onCancel }) {
  const { data, error: loadError } = useResource((signal) => loadOptions(solicitud.id, signal), [solicitud.id]);
  const [tecnicoId, setTecnicoId] = useState('');
  const [prioridadId, setPrioridadId] = useState('');
  const [localError, setLocalError] = useState(null);
  const { submit, pending, error, fieldErrors } = useSubmit((body) => assign(solicitud.id, body));

  async function handleSubmit(event) {
    event.preventDefault();
    if (!tecnicoId) {
      setLocalError('Elige un técnico.');
      return;
    }
    setLocalError(null);
    const result = await submit({ tecnicoId, prioridadId: prioridadId || undefined });
    if (result.ok) onDone();
    else if (needsReload(result.error)) {
      if (isConflict(result.error)) onConflict?.(CONFLICT_MESSAGE);
      onDone();
    }
  }

  if (loadError) return <p className="form-error" role="alert">{loadError.detail}</p>;
  if (!data) return <Skeleton lines={2} />;
  const failure = error && !needsReload(error) && error.status !== 400 ? error.detail : null;
  const current = solicitud.responsableActual?.id;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {data.technicians.length === 0 ? (
        <p className="card__lead">No hay técnicos activos en el área.</p>
      ) : (
        <SelectField
          label="Técnico"
          name="tecnicoId"
          placeholder="Elige un técnico"
          options={data.technicians.map((t) => ({
            value: t.id,
            label: t.id === current ? `${t.nombreCompleto} (actual)` : t.nombreCompleto,
          }))}
          value={tecnicoId}
          onChange={(event) => setTecnicoId(event.target.value)}
          error={localError || fieldErrors.tecnicoId}
        />
      )}
      {data.priorities && (
        <SelectField
          label="Prioridad (opcional)"
          name="prioridadId"
          placeholder="Mantener la actual"
          options={data.priorities.map((p) => ({ value: p.id, label: p.nombre }))}
          value={prioridadId}
          onChange={(event) => setPrioridadId(event.target.value)}
          error={fieldErrors.prioridadId}
        />
      )}
      {failure && <p className="form-error" role="alert">{failure}</p>}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <Button type="submit" pending={pending} disabled={data.technicians.length === 0}>Asignar</Button>
      </div>
    </form>
  );
}

/** Asignar (sin responsable) o reasignar (con responsable) por POST /assignments. */
export function AssignDialog({ solicitud, onAssigned, onConflict }) {
  const [open, setOpen] = useState(false);
  const title = solicitud.responsableActual ? 'Reasignar' : 'Asignar responsable';
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>{title}</Button>
      <Dialog open={open} title={title} onClose={() => setOpen(false)}>
        {open && (
          <AssignForm
            solicitud={solicitud}
            onConflict={onConflict}
            onCancel={() => setOpen(false)}
            onDone={() => {
              setOpen(false);
              onAssigned();
            }}
          />
        )}
      </Dialog>
    </>
  );
}
