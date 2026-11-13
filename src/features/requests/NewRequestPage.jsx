import { useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, SelectField, TextArea, TextField } from '../../components/ui/index.js';
import { formatBytes } from '../../services/format.js';
import { useCatalogLabels } from '../../services/catalogs.js';
import { useSubmit } from '../../services/useSubmit.js';
import { ATTACHMENT_ACCEPT, validateFiles } from './attachmentRules.js';
import { createRequest, uploadAttachment } from './requestsApi.js';

const EMPTY = { categoriaId: '', ubicacion: '', descripcion: '' };

function validate(values) {
  const errors = {};
  if (!values.categoriaId) errors.categoriaId = 'Elige una categoría.';
  if (!values.ubicacion.trim()) errors.ubicacion = 'Indica la ubicación.';
  if (!values.descripcion.trim()) errors.descripcion = 'Describe el problema.';
  return errors;
}

export const uploadFailure = (error) => error?.fieldErrors?.archivo || error?.detail || 'No se pudo adjuntar.';

/**
 * Crea la solicitud y luego sube cada evidencia válida, una por una. Un archivo
 * que falla no deshace la solicitud: se informa en el detalle.
 */
async function registerWithAttachments(values, files) {
  const created = await createRequest({
    categoriaId: values.categoriaId,
    ubicacion: values.ubicacion.trim(),
    descripcion: values.descripcion.trim(),
  });
  const { valid, rejected } = validateFiles(files, 0);
  const fallidas = rejected.map(({ file, reason }) => ({ nombre: file.name, motivo: reason }));
  for (const file of valid) {
    try {
      await uploadAttachment(created.id, file);
    } catch (error) {
      fallidas.push({ nombre: file.name, motivo: uploadFailure(error) });
    }
  }
  return { created, fallidas };
}

/** P04: registro de una solicitud con evidencias opcionales. */
export default function NewRequestPage() {
  const navigate = useNavigate();
  const inputId = useId();
  const { categories } = useCatalogLabels();
  const [values, setValues] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [localErrors, setLocalErrors] = useState({});
  // Tras crear, la página sigue montada mientras carga el detalle: no se reenvía.
  const createdRef = useRef(false);
  const { submit, pending, error, fieldErrors } = useSubmit(registerWithAttachments);

  const change = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));
  const errorFor = (field) => localErrors[field] || fieldErrors[field];
  const { rejected } = validateFiles(files, 0);
  const reasonOf = (file) => rejected.find((item) => item.file === file)?.reason;

  function addFiles(event) {
    const chosen = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...chosen]);
    event.target.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (createdRef.current) return;
    const errors = validate(values);
    setLocalErrors(errors);
    if (Object.keys(errors).length) return;
    const result = await submit(values, files);
    if (result.ok) {
      createdRef.current = true;
      const { created, fallidas } = result.data;
      navigate(`/solicitudes/${created.id}`, { state: { creada: created.codigo, fallidas } });
    }
  }

  const formError = error && error.status !== 400 ? error.detail : null;

  return (
    <section className="page">
      <header className="page__header">
        <h1>Registrar solicitud</h1>
        <p className="page__lead">Un solo paso · 3 campos obligatorios</p>
      </header>
      <div className="profile-grid">
        <form className="card" onSubmit={handleSubmit} noValidate aria-labelledby="alta-datos">
          <h2 id="alta-datos">Datos de la solicitud</h2>
          <p className="card__lead">La prioridad la asigna la categoría; no se elige aquí.</p>
          <SelectField
            label="Categoría"
            name="categoriaId"
            placeholder="Elige una categoría"
            options={categories.map((c) => ({ value: c.id, label: c.nombre }))}
            value={values.categoriaId}
            onChange={change('categoriaId')}
            error={errorFor('categoriaId')}
          />
          <TextField
            label="Ubicación"
            name="ubicacion"
            placeholder="Pabellón B, aula 302"
            hint="Incluye pabellón y número de aula."
            value={values.ubicacion}
            onChange={change('ubicacion')}
            error={errorFor('ubicacion')}
          />
          <TextArea
            label="Descripción"
            name="descripcion"
            placeholder="Describe el problema con el equipo o servicio…"
            value={values.descripcion}
            onChange={change('descripcion')}
            error={errorFor('descripcion')}
          />
          <div className="field">
            <label className="field__label" htmlFor={inputId}>Evidencias (opcional)</label>
            <input
              id={inputId}
              className="field__control"
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              onChange={addFiles}
              aria-describedby={`${inputId}-hint`}
            />
            <p className="field__hint" id={`${inputId}-hint`}>JPG, PNG o PDF de hasta 5 MB; máximo 5 archivos.</p>
          </div>
          {files.length > 0 && (
            <ul className="file-list" aria-label="Archivos elegidos">
              {files.map((file, index) => {
                const reason = reasonOf(file);
                return (
                  <li key={`${file.name}-${index}`} className={reason ? 'file-list__item file-list__item--error' : 'file-list__item'}>
                    <span className="file-list__name">{file.name}</span>
                    <span className="file-list__meta">{formatBytes(file.size)}</span>
                    {reason && <span className="file-list__error">{reason}</span>}
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                      aria-label={`Quitar ${file.name}`}
                    >
                      Quitar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <Link className="btn btn--secondary" to="/solicitudes">Cancelar</Link>
            <Button type="submit" pending={pending}>Registrar solicitud</Button>
          </div>
        </form>
        <aside className="card">
          <h2>Antes de enviar</h2>
          <ul className="plain-list">
            <li>Elige bien la categoría: define prioridad y SLA.</li>
            <li>Indica la ubicación exacta del equipo.</li>
            <li>Describe el problema en una frase clara.</li>
          </ul>
          <h2>Después de registrar</h2>
          <p className="card__lead">Recibirás un código SOL-AAAA-NNNNNN y podrás seguir el estado desde Mis solicitudes.</p>
        </aside>
      </div>
    </section>
  );
}
