import { useState } from 'react';
import { Button, ErrorState, Skeleton, TextField } from '../../../components/ui/index.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { getPolicy, putPolicy } from '../spacesAdminApi.js';

const FIELDS = [
  { name: 'duracionMinimaMinutos', label: 'Duración mínima (min)', min: 1 },
  { name: 'duracionMaximaMinutos', label: 'Duración máxima (min)', min: 1 },
  { name: 'horasAnticipacionMinima', label: 'Anticipación mínima (horas)', min: 0 },
  { name: 'diasAnticipacionMaxima', label: 'Anticipación máxima (días)', min: 0 },
  { name: 'maxReservasActivasPorDia', label: 'Reservas activas por día', min: 1 },
];
const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.name, '']));

/** `null` cuando la política no existe todavía (404). */
async function loadPolicy(signal) {
  try {
    return { policy: await getPolicy(signal) };
  } catch (error) {
    if (error?.status === 404) return { policy: null };
    throw error;
  }
}

function validate(values) {
  const errors = {};
  FIELDS.forEach(({ name, min }) => {
    const text = values[name].trim();
    if (!/^\d+$/.test(text)) errors[name] = text ? 'Usa un número entero.' : 'Este campo es obligatorio.';
    else if (Number(text) < min) errors[name] = min > 0 ? 'Debe ser mayor que cero.' : 'No puede ser negativa.';
  });
  if (!errors.duracionMinimaMinutos && !errors.duracionMaximaMinutos
    && Number(values.duracionMaximaMinutos) < Number(values.duracionMinimaMinutos)) {
    errors.duracionMaximaMinutos = 'Debe ser mayor o igual a la duración mínima.';
  }
  return errors;
}

function Form({ policy }) {
  const [values, setValues] = useState(() => (
    policy ? Object.fromEntries(FIELDS.map((f) => [f.name, String(policy[f.name])])) : EMPTY
  ));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const save = useSubmit(putPolicy);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaved(false);
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const result = await save.submit(Object.fromEntries(FIELDS.map((f) => [f.name, Number(values[f.name])])));
    if (result.ok) setSaved(true);
  }

  const general = save.error && !Object.keys(save.fieldErrors).length ? save.error.detail : null;

  return (
    <form className="card" onSubmit={handleSubmit} noValidate aria-labelledby="politica-titulo">
      <h2 id="politica-titulo">Política de reservas</h2>
      <p className="card__lead">Aplica a las reservas nuevas. Las ya registradas conservan sus condiciones.</p>
      {!policy && !saved && <p className="notice notice--warning">Todavía no hay una política vigente</p>}
      {saved && <p className="notice notice--success" role="status">Política guardada</p>}
      <div className="policy-grid">
        {FIELDS.map((field) => (
          <TextField
            key={field.name}
            label={field.label}
            name={field.name}
            type="number"
            inputMode="numeric"
            min={field.min}
            value={values[field.name]}
            onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
            error={errors[field.name] || save.fieldErrors[field.name]}
          />
        ))}
      </div>
      {general && <p className="form-error" role="alert">{general}</p>}
      <div className="form-actions">
        <Button type="submit" pending={save.pending}>Guardar política</Button>
      </div>
    </form>
  );
}

/** Política vigente: duración, anticipación y límite diario (los cinco obligatorios). */
export function PolicyForm() {
  const { data, error, status, reload } = useResource((signal) => loadPolicy(signal), []);
  if (status === 'error' && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <Skeleton lines={4} />;
  return <Form policy={data.policy} />;
}
