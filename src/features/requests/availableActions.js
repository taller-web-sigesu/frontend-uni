import { surveyAnswered } from '../../services/pendingContract.js';

export const TERMINAL_STATUSES = ['CERRADO', 'RECHAZADO'];
const REJECTABLE = ['NUEVO', 'ASIGNADO', 'EN_PROCESO'];

export const isTerminal = (estado) => TERMINAL_STATUSES.includes(estado);

/**
 * Acciones que la interfaz ofrece sobre el detalle. Es la misma regla de
 * transiciones del backend; el servidor sigue siendo quien decide.
 */
export function availableActions(solicitud, usuario) {
  const actions = new Set(['COMENTAR']);
  if (!solicitud || !usuario) return actions;
  const { estado } = solicitud;
  const open = !isTerminal(estado);
  if (open) actions.add('ADJUNTAR');

  if (usuario.rol === 'TECNICO' && solicitud.responsableActual?.id === usuario.id) {
    if (estado === 'ASIGNADO') actions.add('INICIAR');
    if (estado === 'EN_PROCESO') actions.add('RESOLVER');
  }

  if (usuario.rol === 'SUPERVISOR') {
    actions.add('VER_AUDITORIA');
    if (estado === 'RESUELTO') actions.add('CERRAR');
    if (REJECTABLE.includes(estado)) actions.add('RECHAZAR');
    if (open) {
      actions.add(solicitud.responsableActual ? 'REASIGNAR' : 'ASIGNAR');
      actions.add('CAMBIAR_PRIORIDAD');
    }
  }

  if ((usuario.rol === 'ESTUDIANTE' || usuario.rol === 'DOCENTE')
    && solicitud.solicitante?.id === usuario.id
    && estado === 'CERRADO'
    && surveyAnswered(solicitud) !== true) {
    actions.add('RESPONDER_ENCUESTA');
  }

  return actions;
}
