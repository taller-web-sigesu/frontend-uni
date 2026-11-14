import { useState } from 'react';
import {
  Badge, Button, ConfirmDialog, DataTable, Dialog, EmptyState, ErrorState, Pagination, SelectField, Skeleton, TextArea, TextField,
} from '../../../components/ui/index.js';
import { countLabel } from '../../../services/format.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { create, list, update } from '../catalogsAdminApi.js';

const PAGE_SIZE = 20;

export const ActiveBadge = ({ activo }) => (activo ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>);

const toFormValue = (value) => (value === null || value === undefined ? '' : String(value));

/** Valor del formulario al tipo del contrato; vacío = `null`. */
function fromFormValue(field, value) {
  const text = value.trim();
  if (!text) return null;
  return field.type === 'number' ? Number(text) : text;
}

function validate(fields, values) {
  return fields.reduce((errors, field) => {
    const text = values[field.name].trim();
    if (field.required && !text) errors[field.name] = 'Este campo es obligatorio.';
    else if (field.type === 'number' && text && !/^-?\d+$/.test(text)) errors[field.name] = 'Usa un número entero.';
    else if (field.positive && text && Number(text) <= 0) errors[field.name] = 'Usa un número entero mayor que cero.';
    return errors;
  }, {});
}

function buildBody(fields, values, record) {
  return fields.reduce((body, field) => {
    if (record && field.createOnly) return body;
    const next = fromFormValue(field, values[field.name]);
    if (!record) {
      if (next !== null) body[field.name] = next;
    } else if (next !== (record[field.name] ?? null)) {
      // En el backend, null conserva el valor; '' borra un texto opcional.
      body[field.name] = next === null ? '' : next;
    }
    return body;
  }, {});
}

function FieldControl({ field, value, onChange, error, readOnly }) {
  const common = { label: field.label, name: field.name, value, onChange, error };
  if (field.type === 'select') {
    return <SelectField {...common} placeholder={field.placeholder ?? `Elige ${field.article || 'una opción'}`} options={field.options} />;
  }
  if (field.type === 'textarea') return <TextArea {...common} rows={3} />;
  return (
    <TextField
      {...common}
      type={field.type === 'number' ? 'number' : 'text'}
      inputMode={field.type === 'number' ? 'numeric' : undefined}
      readOnly={readOnly}
      hint={readOnly ? 'El código no se modifica después del alta.' : field.hint}
    />
  );
}

function RecordForm({ api, fields, record, onSaved, onCancel }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, toFormValue(record?.[f.name])])));
  const [errors, setErrors] = useState({});
  const { submit, pending, error, fieldErrors } = useSubmit((body) => (record ? api.update(record.id, body) : api.create(body)));

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(fields, values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = buildBody(fields, values, record);
    if (record && !Object.keys(body).length) {
      onCancel();
      return;
    }
    const result = await submit(body);
    if (result.ok) onSaved();
  }

  const general = error && !Object.keys(fieldErrors).length ? error.detail : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {fields.map((field) => (
        <FieldControl
          key={field.name}
          field={field}
          value={values[field.name]}
          readOnly={Boolean(record && field.createOnly)}
          onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
          error={errors[field.name] || fieldErrors[field.name]}
        />
      ))}
      {general && <p className="form-error" role="alert">{general}</p>}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <Button type="submit" pending={pending}>Guardar</Button>
      </div>
    </form>
  );
}

/** Adaptador por defecto: un catálogo de /admin/catalogs/{kind}. */
const catalogApi = (kind) => ({
  list: (params, signal) => list(kind, params, signal),
  create: (data) => create(kind, data),
  update: (id, patch) => update(kind, id, patch),
});

/**
 * Lista paginada (activos e inactivos) con alta, edición y baja lógica de un
 * catálogo. `fields` describe el formulario; `createOnly` = solo en el alta;
 * `positive` = entero mayor que cero. `api` ({ list, create, update }) sustituye
 * al catálogo de `kind`; `rowActions(row)` añade botones a cada fila.
 */
export function CatalogTable({ kind, api: customApi, singular, gender = 'f', columns, fields, caption, rowActions }) {
  const api = customApi || catalogApi(kind);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null); // null | 'nuevo' | registro
  const [deactivating, setDeactivating] = useState(null);
  const { data, error, status, reload } = useResource((signal) => api.list({ page, size: PAGE_SIZE }, signal), [page]);
  const toggle = useSubmit((record, activo) => api.update(record.id, { activo }));

  async function setActive(record, activo) {
    const result = await toggle.submit(record, activo);
    if (result.ok) {
      setDeactivating(null);
      reload();
    }
  }

  const allColumns = [
    ...columns,
    { key: 'activo', header: 'Estado', render: (r) => <ActiveBadge activo={r.activo} /> },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (r) => (
        <div className="row-actions">
          <Button variant="ghost" onClick={() => setEditing(r)}>Editar</Button>
          {rowActions?.(r)}
          {r.activo ? (
            <Button variant="ghost" onClick={() => setDeactivating(r)}>Desactivar</Button>
          ) : (
            <Button variant="ghost" pending={toggle.pending} onClick={() => setActive(r, true)}>Activar</Button>
          )}
        </div>
      ),
    },
  ];

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={5} />;
  else if (data.totalElements === 0) content = <EmptyState title={`No hay registros de ${caption.toLowerCase()}`} />;
  else {
    content = (
      <>
        <DataTable caption={caption} columns={allColumns} rows={data.items} getRowKey={(r) => r.id} />
        <Pagination page={data.page} size={data.size} totalElements={data.totalElements} onChange={setPage} />
      </>
    );
  }

  const title = editing === 'nuevo' ? `Crear ${singular}` : `Editar ${singular}`;
  const article = gender === 'f' ? 'La' : 'El';

  return (
    <>
      <div className="section-toolbar">
        {data && <p className="page__lead">{countLabel(data.totalElements, 'registro')}</p>}
        <Button onClick={() => setEditing('nuevo')}>Crear {singular}</Button>
      </div>
      {toggle.error && !deactivating && <p className="form-error" role="alert">{toggle.error.detail}</p>}
      {content}
      <Dialog open={editing !== null} title={title} onClose={() => setEditing(null)}>
        {editing !== null && (
          <RecordForm
            key={editing === 'nuevo' ? 'nuevo' : editing.id}
            api={api}
            fields={fields}
            record={editing === 'nuevo' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Dialog>
      <ConfirmDialog
        open={deactivating !== null}
        title={`Desactivar ${singular}`}
        message={deactivating ? `${article} ${singular} «${deactivating.nombre}» dejará de usarse en registros nuevos. Los datos históricos se conservan.` : ''}
        confirmLabel="Desactivar"
        tone="danger"
        pending={toggle.pending}
        onConfirm={() => setActive(deactivating, false)}
        onCancel={() => {
          setDeactivating(null);
          toggle.reset();
        }}
      >
        {toggle.error && <p className="form-error" role="alert">{toggle.error.detail}</p>}
      </ConfirmDialog>
    </>
  );
}
