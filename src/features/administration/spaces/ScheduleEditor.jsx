import { useState } from 'react';
import { Button, ErrorState, Skeleton } from '../../../components/ui/index.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { getSchedule, putSchedule } from '../spacesAdminApi.js';

export const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const DEFAULT_OPEN = { horaApertura: '08:00', horaCierre: '18:00' };
const CLOSING_ERROR = 'El cierre debe ser posterior a la apertura.';

/** Siete filas (1 = lunes … 7 = domingo); los días sin franja quedan cerrados. */
function toRows(franjas) {
  return DAYS.map((_, index) => {
    const slot = franjas.find((f) => f.diaSemana === index + 1);
    return slot
      ? { abierto: true, horaApertura: slot.horaApertura, horaCierre: slot.horaCierre }
      : { abierto: false, ...DEFAULT_OPEN };
  });
}

function rowErrors(rows) {
  return rows.map((row) => {
    if (!row.abierto) return null;
    if (!row.horaApertura || !row.horaCierre) return 'Indica la apertura y el cierre.';
    return row.horaCierre <= row.horaApertura ? CLOSING_ERROR : null;
  });
}

function ScheduleForm({ spaceId, franjas, onSaved, onCancel }) {
  const [rows, setRows] = useState(() => toRows(franjas));
  const [errors, setErrors] = useState([]);
  const save = useSubmit((body) => putSchedule(spaceId, body));

  const change = (index, field, value) => setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  async function handleSubmit(event) {
    event.preventDefault();
    const found = rowErrors(rows);
    setErrors(found);
    if (found.some(Boolean)) return;
    const body = rows
      .map((row, index) => ({ diaSemana: index + 1, ...row }))
      .filter((row) => row.abierto)
      .map(({ diaSemana, horaApertura, horaCierre }) => ({ diaSemana, horaApertura, horaCierre }));
    // Un error conserva lo editado: las filas no se tocan.
    const result = await save.submit(body);
    if (result.ok) onSaved();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <table className="schedule-table">
        <caption className="data-table__caption">Una franja por día. Los días cerrados no admiten reservas.</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Abierto</th>
            <th scope="col">Apertura</th>
            <th scope="col">Cierre</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const day = DAYS[index];
            const error = errors[index];
            return (
              <tr key={day}>
                <th scope="row" className="schedule-table__day">{day}</th>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Abierto el ${day}`}
                    checked={row.abierto}
                    onChange={(event) => change(index, 'abierto', event.target.checked)}
                  />
                </td>
                <td>
                  <input
                    className="field__control"
                    type="time"
                    step="900"
                    aria-label={`Apertura del ${day}`}
                    disabled={!row.abierto}
                    value={row.horaApertura}
                    onChange={(event) => change(index, 'horaApertura', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="field__control"
                    type="time"
                    step="900"
                    aria-label={`Cierre del ${day}`}
                    aria-invalid={error ? 'true' : undefined}
                    disabled={!row.abierto}
                    value={row.horaCierre}
                    onChange={(event) => change(index, 'horaCierre', event.target.value)}
                  />
                  {error && <p className="field__error">{error}</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {save.error && <p className="form-error" role="alert">{save.error.detail}</p>}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={save.pending}>Cancelar</Button>
        <Button type="submit" pending={save.pending}>Guardar horario</Button>
      </div>
    </form>
  );
}

/** Horario semanal de un espacio; `PUT` sustituye el horario completo. */
export function ScheduleEditor({ spaceId, onSaved, onCancel }) {
  const { data, error, status, reload } = useResource((signal) => getSchedule(spaceId, signal), [spaceId]);
  if (status === 'error' && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <Skeleton lines={7} />;
  return <ScheduleForm spaceId={spaceId} franjas={data.franjas} onSaved={onSaved} onCancel={onCancel} />;
}
