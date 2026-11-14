import { useCallback, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useCurrentUser } from '../../app/userContext.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/index.js';
import { useCatalogLabels } from '../../services/catalogs.js';
import { useResource } from '../../services/useResource.js';
import { AssignDialog } from '../management/detail/AssignDialog.jsx';
import { AuditPanel } from '../management/detail/AuditPanel.jsx';
import { PriorityControl } from '../management/detail/PriorityControl.jsx';
import { TransitionActions } from '../management/detail/TransitionActions.jsx';
import { availableActions } from './availableActions.js';
import { AttachmentsSection } from './detail/AttachmentsSection.jsx';
import { CommentsSection } from './detail/CommentsSection.jsx';
import { SurveySection } from './detail/SurveySection.jsx';
import { HistoryTimeline } from './detail/HistoryTimeline.jsx';
import { peopleIndex } from './detail/people.js';
import { RequestSummary, SlaBadge } from './detail/RequestSummary.jsx';
import { StatusBadge } from './requestColumns.jsx';
import { getRequest, listComments, listHistory } from './requestsApi.js';

const BACK_LINKS = {
  TECNICO: { to: '/bandeja', label: 'Volver a mis asignaciones' },
  SUPERVISOR: { to: '/gestion', label: 'Volver a gestión de área' },
};
const backLinkFor = (rol) => BACK_LINKS[rol] || { to: '/solicitudes', label: 'Volver a mis solicitudes' };

async function loadDetail(id, signal) {
  const [solicitud, history, comments] = await Promise.all([
    getRequest(id, signal),
    listHistory(id, {}, signal),
    listComments(id, {}, signal),
  ]);
  return { solicitud, history: history.items, comments: comments.items };
}

function CreatedNotice({ state }) {
  if (!state?.creada) return null;
  return (
    <>
      <p className="notice notice--success" role="status">Solicitud {state.creada} registrada</p>
      {state.fallidas?.length > 0 && (
        <div className="notice notice--warning" role="alert">
          <p>No se adjuntaron estos archivos; puedes intentarlo de nuevo en Evidencias:</p>
          <ul>
            {state.fallidas.map((item, index) => (
              <li key={`${item.nombre}-${index}`}>{item.nombre}: {item.motivo}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/**
 * Detalle compuesto por secciones (P05). Las acciones visibles salen de
 * `availableActions`; tras cualquier cambio, `reload()` vuelve a pedir todo.
 */
export default function RequestDetailPage() {
  const { id } = useParams();
  // Otra solicitud = otra instancia: nada de la anterior (datos, avisos) se muestra.
  return <RequestDetail key={id} id={id} />;
}

function RequestDetail({ id }) {
  const location = useLocation();
  const user = useCurrentUser();
  const { categoryName, priorityName } = useCatalogLabels();
  const { data, error, status, reload, setData } = useResource((signal) => loadDetail(id, signal), [id]);
  const back = backLinkFor(user?.rol);
  const [conflict, setConflict] = useState(null);
  const [changes, setChanges] = useState(0);

  // Tras una acción (o un 409) se recarga todo: las acciones se recalculan con el estado nuevo.
  const handleChanged = useCallback(() => {
    setChanges((count) => count + 1);
    reload();
  }, [reload]);

  const addComment = useCallback(
    (comment) => setData((prev) => ({ ...prev, comments: [...prev.comments, comment] })),
    [setData],
  );

  // Un 404 (también al recargar tras perder el acceso) reemplaza el detalle anterior.
  if (status === 'error' && error?.status === 404) {
    return (
      <section className="page">
        <h1>Detalle y seguimiento de solicitud</h1>
        <EmptyState
          title="No encontramos esta solicitud o no tienes acceso a ella"
          description="Revisa el enlace o vuelve a tu lista."
          action={<Link className="btn btn--secondary" to={back.to}>{back.label}</Link>}
        />
      </section>
    );
  }
  if (status === 'error' && !data) {
    return (
      <section className="page">
        <h1>Detalle y seguimiento de solicitud</h1>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }
  if (!data) {
    return (
      <section className="page">
        <h1>Detalle y seguimiento de solicitud</h1>
        <Skeleton lines={6} />
      </section>
    );
  }

  const { solicitud, history, comments } = data;
  const actions = availableActions(solicitud, user);
  const personName = peopleIndex(solicitud, comments, user);

  return (
    <section className="page">
      <Link className="back-link" to={back.to}>‹ {back.label}</Link>
      <h1 className="page__kicker">Detalle y seguimiento de solicitud</h1>
      <CreatedNotice state={location.state} />
      {status === 'error' && <ErrorState error={error} onRetry={reload} />}
      {conflict && <p className="notice notice--warning" role="status">{conflict}</p>}
      <header className="detail-header">
        <div className="detail-header__title">
          <h2>{solicitud.codigo}</h2>
          <StatusBadge estado={solicitud.estado} />
          <span className="badge badge--neutral">Prioridad: {priorityName(solicitud.prioridadId)}</span>
          <SlaBadge sla={solicitud.sla} />
        </div>
        <div className="detail-header__actions">
          <TransitionActions solicitud={solicitud} actions={actions} onChanged={handleChanged} onConflict={setConflict} />
          {(actions.has('ASIGNAR') || actions.has('REASIGNAR')) && (
            <AssignDialog solicitud={solicitud} onAssigned={handleChanged} onConflict={setConflict} />
          )}
        </div>
      </header>
      <div className="detail-grid">
        <div className="detail-grid__main">
          <RequestSummary solicitud={solicitud} categoryName={categoryName} />
          <AttachmentsSection requestId={solicitud.id} canAttach={actions.has('ADJUNTAR')} />
          {actions.has('RESPONDER_ENCUESTA') && (
            <SurveySection requestId={solicitud.id} answered={solicitud.encuestaRespondida} />
          )}
          {actions.has('CAMBIAR_PRIORIDAD') && (
            <PriorityControl solicitud={solicitud} onChanged={handleChanged} onConflict={setConflict} />
          )}
          {actions.has('VER_AUDITORIA') && (
            <AuditPanel requestId={solicitud.id} personName={personName} reloadKey={changes} />
          )}
        </div>
        <aside className="card detail-grid__side">
          <HistoryTimeline items={history} personName={personName} />
          {actions.has('COMENTAR') && (
            <CommentsSection requestId={solicitud.id} comments={comments} onAdded={addComment} />
          )}
        </aside>
      </div>
    </section>
  );
}
