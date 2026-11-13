import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useCurrentUser } from '../../app/userContext.js';
import { Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '../../components/ui/index.js';
import { RESERVATION_STATUS_LABELS } from '../../services/format.js';
import { useResource } from '../../services/useResource.js';
import { useSubmit } from '../../services/useSubmit.js';
import { HistoryTimeline } from '../requests/detail/HistoryTimeline.jsx';
import { dayLabel, ReservationStatusBadge, slotLabel, spaceOf } from './reservationColumns.jsx';
import { canCancel } from './reservationRules.js';
import { changeReservationStatus, getReservation, listReservationHistory } from './reservationsApi.js';
import { useSpaceNames } from './useSpaceNames.js';

const TITLE = 'Detalle de reserva';
export const CANCEL_CONFLICT = 'La reserva ya no se puede cancelar';

async function loadDetail(id, signal) {
  const [reserva, history] = await Promise.all([getReservation(id, signal), listReservationHistory(id, signal)]);
  return { reserva, history: history.items };
}

function Item({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function ReservationDetailPage() {
  const { id } = useParams();
  return <ReservationDetail key={id} id={id} />;
}

function ReservationDetail({ id }) {
  const user = useCurrentUser();
  const { spaceName } = useSpaceNames();
  const { data, error, status, reload } = useResource((signal) => loadDetail(id, signal), [id]);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState(null);
  const cancel = useSubmit(() => changeReservationStatus(id, { estado: 'CANCELADA' }));

  async function confirmCancel() {
    const result = await cancel.submit();
    if (result.ignored) return;
    if (result.ok) {
      setNotice({ tone: 'success', text: 'Reserva cancelada' });
    } else if (result.error?.status === 409) {
      setNotice({ tone: 'warning', text: CANCEL_CONFLICT });
    } else {
      return; // El error queda en el diálogo.
    }
    setConfirming(false);
    cancel.reset();
    reload();
  }

  if (status === 'error' && error?.status === 404) {
    return (
      <section className="page">
        <h1>{TITLE}</h1>
        <EmptyState
          title="No encontramos esta reserva o no tienes acceso a ella"
          action={<Link className="btn btn--secondary" to="/reservas">Volver a mis reservas</Link>}
        />
      </section>
    );
  }
  if (status === 'error' && !data) {
    return (
      <section className="page">
        <h1>{TITLE}</h1>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }
  if (!data) {
    return (
      <section className="page">
        <h1>{TITLE}</h1>
        <Skeleton lines={6} />
      </section>
    );
  }

  const { reserva, history } = data;
  const own = reserva.solicitanteId === user?.id;
  const personName = (actorId) => (actorId === user?.id ? user.nombreCompleto : null);

  return (
    <section className="page">
      <Link className="back-link" to={own ? '/reservas' : '/reservas/aprobacion'}>
        ‹ {own ? 'Volver a mis reservas' : 'Volver a aprobación de reservas'}
      </Link>
      <h1 className="page__kicker">{TITLE}</h1>
      {status === 'error' && <ErrorState error={error} onRetry={reload} />}
      {notice && <p className={`notice notice--${notice.tone}`} role="status">{notice.text}</p>}
      <header className="detail-header">
        <div className="detail-header__title">
          <h2>{reserva.codigo}</h2>
          <ReservationStatusBadge estado={reserva.estado} />
        </div>
        <div className="detail-header__actions">
          {canCancel(reserva, user) && (
            <Button variant="danger" onClick={() => setConfirming(true)}>Cancelar reserva</Button>
          )}
        </div>
      </header>
      <div className="detail-grid">
        <div className="detail-grid__main">
          <section className="card" aria-labelledby="reserva-datos">
            <h2 id="reserva-datos">Datos de la reserva</h2>
            <dl className="data-list data-list--grid">
              <Item label="Espacio">{spaceOf(reserva, spaceName)}</Item>
              <Item label="Fecha">{dayLabel(reserva.fecha)}</Item>
              <Item label="Horario">{slotLabel(reserva)}</Item>
              <Item label="Asistentes">{reserva.numAsistentes ?? 'No indicado'}</Item>
              <Item label="Motivo">{reserva.motivo}</Item>
              {reserva.motivoRechazo && <Item label="Motivo de rechazo">{reserva.motivoRechazo}</Item>}
            </dl>
          </section>
        </div>
        <aside className="card detail-grid__side">
          <HistoryTimeline items={history} personName={personName} labels={RESERVATION_STATUS_LABELS} />
        </aside>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Cancelar reserva"
        message={`La franja ${slotLabel(reserva)} del ${dayLabel(reserva.fecha)} quedará libre. Esta acción no se puede deshacer.`}
        confirmLabel="Cancelar reserva"
        cancelLabel="Volver"
        tone="danger"
        pending={cancel.pending}
        onConfirm={confirmCancel}
        onCancel={() => {
          setConfirming(false);
          cancel.reset();
        }}
      >
        {cancel.error && <p className="form-error" role="alert">{cancel.error.detail}</p>}
      </ConfirmDialog>
    </section>
  );
}
