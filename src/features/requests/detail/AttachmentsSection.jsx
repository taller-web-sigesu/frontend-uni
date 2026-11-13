import { useId, useState } from 'react';
import { Button, ConfirmDialog, ErrorState, Skeleton } from '../../../components/ui/index.js';
import { downloadBlob } from '../../../services/download.js';
import { formatBytes, formatDateTime } from '../../../services/format.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { ATTACHMENT_ACCEPT, ATTACHMENT_MESSAGES, MAX_ATTACHMENTS, validateFiles } from '../attachmentRules.js';
import {
  deleteAttachment, downloadAttachment, listAttachments, uploadAttachment,
} from '../requestsApi.js';

const failureOf = (error) => error?.fieldErrors?.archivo || error?.detail || 'No se pudo completar la operación.';

/** Sube los archivos válidos uno por uno; devuelve los que fallaron con su motivo. */
async function uploadAll(requestId, files, vigentes) {
  const { valid, rejected } = validateFiles(files, vigentes);
  const failed = rejected.map(({ file, reason }) => ({ nombre: file.name, motivo: reason }));
  for (const file of valid) {
    try {
      await uploadAttachment(requestId, file);
    } catch (error) {
      failed.push({ nombre: file.name, motivo: failureOf(error) });
    }
  }
  return failed;
}

/**
 * Evidencias de la solicitud (HU-26). La descarga va con Bearer (no es un
 * enlace directo) y «Eliminar» solo aparece si el servidor dice `puedeEliminar`.
 */
export function AttachmentsSection({ requestId, canAttach }) {
  const inputId = useId();
  const { data, error, status, reload } = useResource((signal) => listAttachments(requestId, signal), [requestId]);
  const [failures, setFailures] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const upload = useSubmit((files) => uploadAll(requestId, files, data?.length ?? 0));
  const remove = useSubmit((attachment) => deleteAttachment(requestId, attachment.id));
  const download = useSubmit((attachment) => downloadAttachment(requestId, attachment.id).then(downloadBlob));

  const items = data || [];
  const full = items.length >= MAX_ATTACHMENTS;

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    const result = await upload.submit(files);
    setFailures(result.ok ? result.data : [{ nombre: files.map((f) => f.name).join(', '), motivo: failureOf(result.error) }]);
    reload();
  }

  async function confirmDelete() {
    const result = await remove.submit(toDelete);
    setToDelete(null);
    if (!result.ok) setFailures([{ nombre: toDelete.nombre, motivo: failureOf(result.error) }]);
    reload();
  }

  let list;
  if (status === 'error' && !data) list = <ErrorState error={error} onRetry={reload} />;
  else if (!data) list = <Skeleton lines={2} />;
  else if (items.length === 0) list = <p className="card__lead">Sin evidencias adjuntas.</p>;
  else {
    list = (
      <ul className="file-list">
        {items.map((attachment) => (
          <li key={attachment.id} className="file-list__item">
            <span className="file-list__name">{attachment.nombre}</span>
            <span className="file-list__meta">
              {formatBytes(attachment.tamanoBytes)} · {attachment.autorNombre} · {formatDateTime(attachment.creadoEn)}
            </span>
            <span className="file-list__actions">
              <Button variant="secondary" onClick={() => download.submit(attachment)}>Descargar</Button>
              {attachment.puedeEliminar && (
                <Button variant="danger" onClick={() => setToDelete(attachment)}>Eliminar</Button>
              )}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="card" aria-labelledby="detalle-evidencias">
      <h2 id="detalle-evidencias">Evidencias</h2>
      <p className="card__lead">JPG, PNG o PDF de hasta 5 MB; máximo 5 por solicitud.</p>
      {list}
      {download.error && <p className="form-error" role="alert">{failureOf(download.error)}</p>}
      {failures.length > 0 && (
        <div className="notice notice--warning" role="alert">
          <p>No se adjuntaron estos archivos:</p>
          <ul>
            {failures.map((item) => <li key={item.nombre}>{item.nombre}: {item.motivo}</li>)}
          </ul>
        </div>
      )}
      {canAttach && (
        <div className="field">
          <label className="field__label" htmlFor={inputId}>Adjuntar evidencia</label>
          <input
            id={inputId}
            className="field__control"
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            disabled={full || upload.pending || !data}
            aria-describedby={full ? `${inputId}-full` : undefined}
            onChange={handleFiles}
          />
          {full && <p className="field__hint" id={`${inputId}-full`}>{ATTACHMENT_MESSAGES.limit}</p>}
          {upload.pending && <p className="field__hint" role="status">Subiendo…</p>}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar evidencia"
        message={toDelete ? `Se quitará «${toDelete.nombre}» de la solicitud.` : ''}
        confirmLabel="Eliminar"
        tone="danger"
        pending={remove.pending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}
