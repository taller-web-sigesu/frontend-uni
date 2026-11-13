import { useState } from 'react';
import {
  Button, ConfirmDialog, DataTable, EmptyState, ErrorState, Pagination, Skeleton, TextArea,
} from '../../../components/ui/index.js';
import { formatDateTime } from '../../../services/format.js';
import { useResource } from '../../../services/useResource.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { decideAccount, listPendingAccounts } from '../usersApi.js';

const PAGE_SIZE = 20;
const MAX_REASON = 500;
const ALREADY_REVIEWED = 'Esta cuenta ya fue revisada';

/**
 * Bandeja de cuentas auto-registradas (HU-28), en el orden del servidor (la
 * más antigua primero). Tras cada decisión, o si otra persona ya la revisó, recarga.
 */
export function PendingAccountsPanel() {
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [motivoError, setMotivoError] = useState(null);
  const { data, error, status, reload } = useResource((signal) => listPendingAccounts({ page, size: PAGE_SIZE }, signal), [page]);
  const decide = useSubmit((account, body) => decideAccount(account.id, body));

  function closeReject() {
    setRejecting(null);
    setMotivo('');
    setMotivoError(null);
    decide.reset();
  }

  async function run(account, body, success) {
    setNotice(null);
    const result = await decide.submit(account, body);
    if (result.ok) {
      setNotice({ tone: 'success', text: success });
    } else if (result.error?.codigo === 'CUENTA_NO_PENDIENTE' || result.error?.status === 404) {
      setNotice({ tone: 'warning', text: ALREADY_REVIEWED });
    } else {
      return;
    }
    closeReject();
    reload();
  }

  async function confirmReject() {
    const text = motivo.trim();
    if (!text) {
      setMotivoError('Indica el motivo del rechazo.');
      return;
    }
    if (text.length > MAX_REASON) {
      setMotivoError(`Usa como máximo ${MAX_REASON} caracteres.`);
      return;
    }
    setMotivoError(null);
    await run(rejecting, { estadoCuenta: 'RECHAZADA', motivo: text }, `Cuenta de ${rejecting.nombreCompleto} rechazada`);
  }

  const columns = [
    { key: 'nombreCompleto', header: 'Nombre completo' },
    { key: 'correo', header: 'Correo', render: (a) => <span className="mono-soft">{a.correo}</span> },
    { key: 'creadoEn', header: 'Fecha de registro', render: (a) => formatDateTime(a.creadoEn) },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (a) => (
        <div className="row-actions">
          <Button
            variant="secondary"
            disabled={decide.pending}
            onClick={() => run(a, { estadoCuenta: 'ACTIVA' }, `Cuenta de ${a.nombreCompleto} aprobada`)}
          >
            Aprobar
          </Button>
          <Button variant="ghost" disabled={decide.pending} onClick={() => setRejecting(a)}>Rechazar</Button>
        </div>
      ),
    },
  ];

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={4} />;
  else if (data.totalElements === 0) content = <EmptyState title="No hay cuentas pendientes de aprobación" />;
  else {
    content = (
      <>
        <DataTable caption="Cuentas pendientes de aprobación" columns={columns} rows={data.items} getRowKey={(a) => a.id} />
        <Pagination page={data.page} size={data.size} totalElements={data.totalElements} onChange={setPage} />
      </>
    );
  }

  const failure = decide.error && !rejecting ? decide.error.detail : null;

  return (
    <>
      {notice && <p className={`notice notice--${notice.tone}`} role="status">{notice.text}</p>}
      {failure && <p className="form-error" role="alert">{failure}</p>}
      {content}
      <ConfirmDialog
        open={rejecting !== null}
        title="Rechazar cuenta"
        message={rejecting ? `La cuenta de ${rejecting.nombreCompleto} no podrá iniciar sesión.` : ''}
        confirmLabel="Rechazar cuenta"
        tone="danger"
        pending={decide.pending}
        onConfirm={confirmReject}
        onCancel={closeReject}
      >
        <TextArea
          label="Motivo"
          name="motivo"
          rows={3}
          maxLength={MAX_REASON}
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          error={motivoError || (rejecting && decide.error ? decide.error.fieldErrors?.motivo || decide.error.detail : null)}
          hint={`Hasta ${MAX_REASON} caracteres.`}
        />
      </ConfirmDialog>
    </>
  );
}
