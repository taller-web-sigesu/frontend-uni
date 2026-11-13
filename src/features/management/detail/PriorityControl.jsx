import { useState } from 'react';
import { Button, SelectField } from '../../../components/ui/index.js';
import { listPriorityOptions } from '../../../services/pendingContract.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { changePriority } from '../../requests/requestsApi.js';
import { CONFLICT_MESSAGE, isConflict, needsReload } from './conflict.js';

/**
 * Ajuste de prioridad del supervisor (PATCH /requests/{id}). El contrato no
 * expone las opciones de prioridad: sin ellas el control no se muestra.
 */
export function PriorityControl({ solicitud, onChanged, onConflict }) {
  const { data: options } = useResource(() => listPriorityOptions(), []);
  const [prioridadId, setPrioridadId] = useState('');
  const { submit, pending, error } = useSubmit((id) => changePriority(solicitud.id, id));

  if (!options) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!prioridadId || prioridadId === solicitud.prioridadId) return;
    const result = await submit(prioridadId);
    if (result.ok || needsReload(result.error)) {
      if (isConflict(result.error)) onConflict?.(CONFLICT_MESSAGE);
      setPrioridadId('');
      onChanged();
    }
  }

  const failure = error && !needsReload(error) ? error.fieldErrors?.prioridadId || error.detail : null;

  return (
    <section className="card" aria-labelledby="detalle-prioridad">
      <h2 id="detalle-prioridad">Prioridad</h2>
      <form className="inline-form" onSubmit={handleSubmit} noValidate>
        <SelectField
          label="Nueva prioridad"
          name="prioridadId"
          placeholder="Elige una prioridad"
          options={options.filter((p) => p.id !== solicitud.prioridadId).map((p) => ({ value: p.id, label: p.nombre }))}
          value={prioridadId}
          onChange={(event) => setPrioridadId(event.target.value)}
          error={failure}
        />
        <Button type="submit" variant="secondary" pending={pending} disabled={!prioridadId}>Guardar prioridad</Button>
      </form>
    </section>
  );
}
