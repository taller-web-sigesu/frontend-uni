import { useState } from 'react';
import { Button, ConfirmDialog, TextArea } from '../../../components/ui/index.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { changeStatus } from '../../requests/requestsApi.js';
import { CONFLICT_MESSAGE, isConflict, needsReload } from './conflict.js';

const BUTTONS = [
  { action: 'INICIAR', estado: 'EN_PROCESO', label: 'Iniciar atención' },
  { action: 'RESOLVER', estado: 'RESUELTO', label: 'Marcar como resuelta' },
  { action: 'CERRAR', estado: 'CERRADO', label: 'Cerrar solicitud' },
];

/**
 * Transiciones por PATCH /status. Nunca envía `ASIGNADO`: la asignación es de
 * AssignDialog. Ante 409 avisa (`onConflict`) y pide recargar (`onChanged`).
 */
export function TransitionActions({ solicitud, actions, onChanged, onConflict }) {
  const [rejecting, setRejecting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [motivoError, setMotivoError] = useState(null);
  const { submit, pending, error } = useSubmit((body) => changeStatus(solicitud.id, body));

  async function run(body) {
    const result = await submit(body);
    if (result.ok || needsReload(result.error)) {
      if (isConflict(result.error)) onConflict?.(CONFLICT_MESSAGE);
      setRejecting(false);
      setClosing(false);
      onChanged();
    }
    return result;
  }

  async function confirmClose() {
    await run({ estado: 'CERRADO' });
  }

  async function confirmReject() {
    const text = motivo.trim();
    if (!text) {
      setMotivoError('Indica el motivo del rechazo.');
      return;
    }
    setMotivoError(null);
    const result = await run({ estado: 'RECHAZADO', motivo: text });
    if (result.ok) setMotivo('');
  }

  const visible = BUTTONS.filter((button) => actions.has(button.action) && button.action !== 'CERRAR');
  const failure = error && !needsReload(error) ? error.fieldErrors?.motivo || error.detail : null;

  return (
    <>
      {visible.map((button) => (
        <Button key={button.action} pending={pending} onClick={() => run({ estado: button.estado })}>
          {button.label}
        </Button>
      ))}
      {actions.has('CERRAR') && (
        <Button pending={pending} onClick={() => setClosing(true)}>Cerrar solicitud</Button>
      )}
      {actions.has('RECHAZAR') && (
        <Button variant="danger" disabled={pending} onClick={() => setRejecting(true)}>Rechazar solicitud</Button>
      )}
      {failure && !rejecting && !closing && <p className="form-error detail-header__error" role="alert">{failure}</p>}
      <ConfirmDialog
        open={rejecting}
        title="Rechazar solicitud"
        message={`La solicitud ${solicitud.codigo} quedará rechazada. Esta acción no se puede deshacer.`}
        confirmLabel="Rechazar solicitud"
        tone="danger"
        pending={pending}
        onConfirm={confirmReject}
        onCancel={() => {
          setRejecting(false);
          setMotivoError(null);
        }}
      >
        <TextArea
          label="Motivo"
          name="motivo"
          rows={3}
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          error={motivoError || (rejecting ? failure : null)}
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={closing}
        title="Cerrar solicitud"
        message={`La solicitud ${solicitud.codigo} quedará cerrada. Esta acción no se puede deshacer.`}
        confirmLabel="Cerrar solicitud"
        pending={pending}
        onConfirm={confirmClose}
        onCancel={() => setClosing(false)}
      >
        {failure && <p className="form-error" role="alert">{failure}</p>}
      </ConfirmDialog>
    </>
  );
}
