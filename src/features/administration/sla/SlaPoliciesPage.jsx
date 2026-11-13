import { useState } from 'react';
import {
  Badge, Button, DataTable, Dialog, EmptyState, ErrorState, Pagination, SelectField, Skeleton, TextField,
} from '../../../components/ui/index.js';
import { formatDate, limaLocalToUtc, utcToLimaLocal } from '../../../services/format.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { listAll } from '../catalogsAdminApi.js';
import { createPolicy, listPolicies, updatePolicy } from '../slaApi.js';

const PAGE_SIZE = 20;
export const PRECEDENCE = 'Si una solicitud tiene política por categoría y por prioridad, se aplica la de categoría.';

async function loadScopes(signal) {
  const [categories, priorities] = await Promise.all([listAll('categories', signal), listAll('priorities', signal)]);
  return { categories, priorities };
}

function scopeLabel(policy, scopes) {
  if (policy.categoriaId) {
    const name = scopes.categories.find((c) => c.id === policy.categoriaId)?.nombre ?? `Categoría ${policy.categoriaId}`;
    return `Categoría: ${name}`;
  }
  const name = scopes.priorities.find((p) => p.id === policy.prioridadId)?.nombre ?? `Prioridad ${policy.prioridadId}`;
  return `Prioridad: ${name}`;
}

function validityLabel(policy) {
  const from = formatDate(policy.vigenteDesde);
  return `${from} – ${policy.vigenteHasta ? formatDate(policy.vigenteHasta) : 'sin fecha de fin'}`;
}

function initialValues(policy) {
  return {
    alcance: policy?.prioridadId ? 'prioridad' : 'categoria',
    categoriaId: '',
    prioridadId: '',
    horasObjetivo: policy ? String(policy.horasObjetivo) : '',
    horasAviso: policy ? String(policy.horasAviso) : '',
    vigenteDesde: utcToLimaLocal(policy?.vigenteDesde),
    vigenteHasta: utcToLimaLocal(policy?.vigenteHasta),
  };
}

const positiveInt = (text) => /^\d+$/.test(text) && Number(text) > 0;

function validate(values, policy) {
  const creating = !policy;
  const errors = {};
  if (creating) {
    if (values.alcance === 'categoria' && !values.categoriaId) errors.categoriaId = 'Elige una categoría.';
    if (values.alcance === 'prioridad' && !values.prioridadId) errors.prioridadId = 'Elige una prioridad.';
  }
  if (!positiveInt(values.horasObjetivo)) errors.horasObjetivo = 'Usa un número entero mayor que cero.';
  if (!positiveInt(values.horasAviso)) errors.horasAviso = 'Usa un número entero mayor que cero.';
  else if (positiveInt(values.horasObjetivo) && Number(values.horasAviso) >= Number(values.horasObjetivo)) {
    errors.horasAviso = 'Debe ser menor que las horas objetivo.';
  }
  if (values.vigenteDesde && values.vigenteHasta && values.vigenteHasta <= values.vigenteDesde) {
    errors.vigenteHasta = 'Debe ser posterior al inicio de la vigencia.';
  }
  // El contrato no permite borrar fechas: null en el PATCH conserva el valor.
  if (policy?.vigenteDesde && !values.vigenteDesde) errors.vigenteDesde = 'La fecha de inicio no se puede quitar; indica otra fecha.';
  if (policy?.vigenteHasta && !values.vigenteHasta) errors.vigenteHasta = 'La fecha de fin no se puede quitar; indica otra fecha.';
  return errors;
}

function createBody(values) {
  const body = values.alcance === 'categoria' ? { categoriaId: values.categoriaId } : { prioridadId: values.prioridadId };
  body.horasObjetivo = Number(values.horasObjetivo);
  body.horasAviso = Number(values.horasAviso);
  if (values.vigenteDesde) body.vigenteDesde = limaLocalToUtc(values.vigenteDesde);
  if (values.vigenteHasta) body.vigenteHasta = limaLocalToUtc(values.vigenteHasta);
  return body;
}

/** Solo plazos y vigencia que cambiaron; el alcance nunca se envía. */
function patchBody(values, policy) {
  const patch = {};
  if (Number(values.horasObjetivo) !== policy.horasObjetivo) patch.horasObjetivo = Number(values.horasObjetivo);
  if (Number(values.horasAviso) !== policy.horasAviso) patch.horasAviso = Number(values.horasAviso);
  if (values.vigenteDesde !== utcToLimaLocal(policy.vigenteDesde)) patch.vigenteDesde = limaLocalToUtc(values.vigenteDesde);
  if (values.vigenteHasta !== utcToLimaLocal(policy.vigenteHasta)) patch.vigenteHasta = limaLocalToUtc(values.vigenteHasta);
  return patch;
}

function PolicyForm({ policy, scopes, onSaved, onCancel }) {
  const creating = !policy;
  const [values, setValues] = useState(() => initialValues(policy));
  const [errors, setErrors] = useState({});
  const { submit, pending, error, fieldErrors } = useSubmit((body) => (creating ? createPolicy(body) : updatePolicy(policy.id, body)));
  const set = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));
  const active = (list) => list.filter((item) => item.activo).map((item) => ({ value: item.id, label: item.nombre }));

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(values, policy);
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = creating ? createBody(values) : patchBody(values, policy);
    if (!creating && !Object.keys(body).length) {
      onCancel();
      return;
    }
    const result = await submit(body);
    if (result.ok) onSaved();
  }

  const fieldError = (field) => errors[field] || fieldErrors[field];
  const general = error && !Object.keys(fieldErrors).length ? error.detail : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {creating ? (
        <>
          <fieldset className="choice-group">
            <legend className="field__label">Aplicar por</legend>
            {[['categoria', 'Por categoría'], ['prioridad', 'Por prioridad']].map(([value, label]) => (
              <label key={value} className="choice-group__option">
                <input type="radio" name="alcance" value={value} checked={values.alcance === value} onChange={set('alcance')} />
                {label}
              </label>
            ))}
          </fieldset>
          {values.alcance === 'categoria' ? (
            <SelectField label="Categoría" name="categoriaId" placeholder="Elige una categoría" options={active(scopes.categories)} value={values.categoriaId} onChange={set('categoriaId')} error={fieldError('categoriaId')} />
          ) : (
            <SelectField label="Prioridad" name="prioridadId" placeholder="Elige una prioridad" options={active(scopes.priorities)} value={values.prioridadId} onChange={set('prioridadId')} error={fieldError('prioridadId')} />
          )}
        </>
      ) : (
        <p className="card__lead">Alcance: {scopeLabel(policy, scopes)}</p>
      )}
      <TextField label="Horas objetivo" name="horasObjetivo" type="number" min="1" inputMode="numeric" value={values.horasObjetivo} onChange={set('horasObjetivo')} error={fieldError('horasObjetivo')} />
      <TextField label="Horas de aviso" name="horasAviso" type="number" min="1" inputMode="numeric" value={values.horasAviso} onChange={set('horasAviso')} error={fieldError('horasAviso')} hint="Cuántas horas antes del límite se avisa; menor que el objetivo." />
      <TextField label="Vigente desde (opcional)" name="vigenteDesde" type="datetime-local" value={values.vigenteDesde} onChange={set('vigenteDesde')} error={fieldError('vigenteDesde')} hint={creating ? 'Hora de Lima. Vacío = desde ahora.' : 'Hora de Lima.'} />
      <TextField label="Vigente hasta (opcional)" name="vigenteHasta" type="datetime-local" value={values.vigenteHasta} onChange={set('vigenteHasta')} error={fieldError('vigenteHasta')} hint="Hora de Lima. Vacío = sin fecha de fin." />
      {general && <p className="form-error" role="alert">{general}</p>}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <Button type="submit" pending={pending}>Guardar</Button>
      </div>
    </form>
  );
}

function PoliciesList({ scopes }) {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null); // null | 'nueva' | política
  const { data, error, status, reload } = useResource((signal) => listPolicies({ page, size: PAGE_SIZE }, signal), [page]);

  const columns = [
    { key: 'alcance', header: 'Alcance', render: (p) => scopeLabel(p, scopes) },
    { key: 'horasObjetivo', header: 'Horas objetivo', render: (p) => `${p.horasObjetivo} h` },
    { key: 'horasAviso', header: 'Horas de aviso', render: (p) => `${p.horasAviso} h` },
    { key: 'vigencia', header: 'Vigencia', render: validityLabel },
    { key: 'activo', header: 'Estado', render: (p) => (p.activo ? <Badge tone="success">Activa</Badge> : <Badge tone="neutral">Inactiva</Badge>) },
    { key: 'acciones', header: 'Acciones', render: (p) => <Button variant="ghost" onClick={() => setEditing(p)}>Editar</Button> },
  ];

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={4} />;
  else if (data.totalElements === 0) content = <EmptyState title="Aún no hay políticas SLA" />;
  else {
    content = (
      <>
        <DataTable caption="Políticas SLA" columns={columns} rows={data.items} getRowKey={(p) => p.id} />
        <Pagination page={data.page} size={data.size} totalElements={data.totalElements} onChange={setPage} />
      </>
    );
  }

  return (
    <>
      <div className="section-toolbar">
        <p className="notice notice--info">{PRECEDENCE}</p>
        <Button onClick={() => setEditing('nueva')}>Nueva política</Button>
      </div>
      {content}
      <Dialog open={editing !== null} title={editing === 'nueva' ? 'Nueva política' : 'Editar política'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <PolicyForm
            key={editing === 'nueva' ? 'nueva' : editing.id}
            policy={editing === 'nueva' ? null : editing}
            scopes={scopes}
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

/** P14: políticas SLA por categoría o prioridad. Los cambios valen para solicitudes nuevas. */
export default function SlaPoliciesPage() {
  const { data: scopes, error, reload } = useResource((signal) => loadScopes(signal), []);
  let content;
  if (error) content = <ErrorState error={error} onRetry={reload} />;
  else if (!scopes) content = <Skeleton lines={4} />;
  else content = <PoliciesList scopes={scopes} />;
  return (
    <section className="page">
      <header className="page__header">
        <h1>Políticas SLA</h1>
        <p className="page__lead">Objetivo y aviso por categoría o prioridad. Los cambios aplican a las solicitudes nuevas.</p>
      </header>
      {content}
    </section>
  );
}
