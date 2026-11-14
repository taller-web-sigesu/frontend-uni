import { useState } from 'react';
import { useCurrentUser } from '../../app/userContext.js';
import {
  Button, DataTable, Dialog, EmptyState, ErrorState, Pagination, Skeleton, TextArea,
} from '../../components/ui/index.js';
import { useResource } from '../../services/useResource.js';
import { useSubmit } from '../../services/useSubmit.js';
import { dayLabel, reservationColumns, slotLabel, spaceOf } from './reservationColumns.jsx';
import { canApprove, SLOT_CONFLICT } from './reservationRules.js';
import { changeReservationStatus, getAvailability, getReservation, listReservations } from './reservationsApi.js';
import { SlotList } from './SlotList.jsx';
import { useSpaceNames } from './useSpaceNames.js';

const PAGE_SIZE = 10;
export const FORBIDDEN_DECISION = 'No puedes decidir sobre esta reserva';

async function loadReview(id, signal) {
  const reserva = await getReservation(id, signal);
  const availability = await getAvailability(reserva.espacioId, reserva.fecha, signal);
  return { reserva, availability };
}

function Item({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Mensaje para el error de una decisión, o `null` si va junto a un campo. */
function decisionMessage(error) {
  if (!error) return null;
  if (error.status === 409 && error.codigo === 'FRANJA_OCUPADA') return SLOT_CONFLICT;
  if (error.status === 403) return FORBIDDEN_DECISION;
  if (error.fieldErrors?.motivo) return null;
  return error.detail;
}

/** Detalle de una pendiente con su disponibilidad del día; aprobar o rechazar con motivo. */
function ReviewPanel({ row, user, spaceName, onDecided }) {
  const { data, error, status, reload } = useResource((signal) => loadReview(row.id, signal), [row.id]);
  const [rejecting, setRejecting] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [motivoError, setMotivoError] = useState(null);
  const decide = useSubmit((body) => changeReservationStatus(row.id, body));

  async function send(body, verb) {
    const result = await decide.submit(body);
    if (result.ok) {
      onDecided(`Reserva ${row.codigo} ${verb}`);
      return;
    }
    // Conflicto o transición inválida: se recargan detalle y disponibilidad.
    if (result.error?.status === 409) reload();
  }

  function reject() {
    if (!motivo.trim()) {
      setMotivoError('Indica el motivo del rechazo.');
      return;
    }
    setMotivoError(null);
    send({ estado: 'RECHAZADA', motivo: motivo.trim() }, 'rechazada');
  }

  if (status === 'error' && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <Skeleton lines={4} />;

  const { reserva, availability } = data;
  const allowed = canApprove(reserva, user);
  const own = reserva.solicitanteId === user?.id;
  const message = decisionMessage(decide.error);

  return (
    <>
      <dl className="data-list data-list--grid">
        <Item label="Espacio">{spaceOf(reserva, spaceName)}</Item>
        <Item label="Fecha">{dayLabel(reserva.fecha)}</Item>
        <Item label="Horario">{slotLabel(reserva)}</Item>
        <Item label="Asistentes">{reserva.numAsistentes ?? 'No indicado'}</Item>
        <Item label="Motivo">{reserva.motivo}</Item>
      </dl>
      <h3 className="card__subtitle">Disponibilidad del día</h3>
      <SlotList availability={availability} current={reserva} />
      {own && <p className="notice notice--info">No puedes decidir sobre tu propia reserva.</p>}
      {!own && !allowed && <p className="notice notice--info">Esta reserva ya no está pendiente.</p>}
      {rejecting && allowed && (
        <TextArea
          label="Motivo del rechazo"
          name="motivo"
          rows={3}
          maxLength={500}
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          error={motivoError || decide.fieldErrors.motivo}
        />
      )}
      {message && <p className="form-error" role="alert">{message}</p>}
      {allowed && (
        <div className="form-actions">
          {rejecting ? (
            <>
              <Button variant="secondary" disabled={decide.pending} onClick={() => setRejecting(false)}>Volver</Button>
              <Button variant="danger" pending={decide.pending} onClick={reject}>Confirmar rechazo</Button>
            </>
          ) : (
            <>
              <Button variant="danger" disabled={decide.pending} onClick={() => setRejecting(true)}>Rechazar</Button>
              <Button pending={decide.pending} onClick={() => send({ estado: 'CONFIRMADA' }, 'aprobada')}>Aprobar</Button>
            </>
          )}
        </div>
      )}
    </>
  );
}

/** P11: pendientes del área (supervisor) o de todas (administrador). */
export default function ApprovalPage() {
  const user = useCurrentUser();
  const { spaceName } = useSpaceNames();
  const [page, setPage] = useState(0);
  const [reviewing, setReviewing] = useState(null);
  const [notice, setNotice] = useState(null);
  const { data, error, status, reload } = useResource(
    (signal) => listReservations({ vista: 'gestion', estado: 'PENDIENTE', page, size: PAGE_SIZE }, signal),
    [page],
  );

  function decided(text) {
    setReviewing(null);
    setNotice(text);
    // Si era la última fila de una página posterior, se vuelve a la anterior.
    if (data && data.items.length === 1 && page > 0) setPage(page - 1);
    else reload();
  }

  const columns = reservationColumns(spaceName, [{
    key: 'acciones',
    header: 'Acciones',
    render: (row) => (
      <Button variant="secondary" aria-label={`Revisar ${row.codigo}`} onClick={() => setReviewing(row)}>Revisar</Button>
    ),
  }]);

  let content;
  if (status === 'error' && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <Skeleton lines={5} />;
  else if (data.totalElements === 0) content = <EmptyState title="No hay reservas pendientes de aprobación" />;
  else {
    content = (
      <>
        {status === 'error' && <ErrorState error={error} onRetry={reload} />}
        <DataTable caption="Reservas pendientes" columns={columns} rows={data.items} getRowKey={(row) => row.id} />
        <Pagination page={data.page} size={data.size} totalElements={data.totalElements} onChange={setPage} />
      </>
    );
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1>Aprobación de reservas</h1>
        {data && <p className="page__lead">{data.totalElements} pendientes</p>}
      </header>
      <p className="notice notice--info">No puedes aprobar tus propias reservas.</p>
      {notice && <p className="notice notice--success" role="status">{notice}</p>}
      {content}
      <Dialog open={reviewing !== null} title={reviewing ? `Revisar ${reviewing.codigo}` : ''} onClose={() => setReviewing(null)}>
        {reviewing && <ReviewPanel key={reviewing.id} row={reviewing} user={user} spaceName={spaceName} onDecided={decided} />}
      </Dialog>
    </section>
  );
}
