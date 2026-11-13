import { availableActions } from './availableActions.js';

const USERS = {
  'TECNICO asignado': { id: '5', rol: 'TECNICO' },
  'TECNICO no asignado': { id: '6', rol: 'TECNICO' },
  SUPERVISOR: { id: '2', rol: 'SUPERVISOR' },
  'ESTUDIANTE propietario': { id: '8', rol: 'ESTUDIANTE' },
  'DOCENTE propietario': { id: '8', rol: 'DOCENTE' },
};

function solicitud(estado, overrides = {}) {
  const terminal = estado === 'CERRADO' || estado === 'RECHAZADO';
  return {
    id: '1',
    estado,
    solicitante: { id: '8', nombreCompleto: 'Ana Demo' },
    responsableActual: estado === 'NUEVO' || terminal ? null : { id: '5', nombreCompleto: 'Técnico TI Demo' },
    ...overrides,
  };
}

test.each([
  ['TECNICO asignado', 'ASIGNADO', ['INICIAR', 'COMENTAR', 'ADJUNTAR']],
  ['TECNICO asignado', 'EN_PROCESO', ['RESOLVER', 'COMENTAR', 'ADJUNTAR']],
  ['TECNICO no asignado', 'ASIGNADO', ['COMENTAR', 'ADJUNTAR']],
  ['SUPERVISOR', 'NUEVO', ['ASIGNAR', 'RECHAZAR', 'CAMBIAR_PRIORIDAD', 'VER_AUDITORIA', 'COMENTAR', 'ADJUNTAR']],
  ['SUPERVISOR', 'RESUELTO', ['CERRAR', 'REASIGNAR', 'CAMBIAR_PRIORIDAD', 'VER_AUDITORIA', 'COMENTAR', 'ADJUNTAR']],
  ['SUPERVISOR', 'CERRADO', ['VER_AUDITORIA', 'COMENTAR']],
  ['ESTUDIANTE propietario', 'CERRADO', ['RESPONDER_ENCUESTA', 'COMENTAR']],
  ['DOCENTE propietario', 'CERRADO', ['RESPONDER_ENCUESTA', 'COMENTAR']],
  ['ESTUDIANTE propietario', 'RECHAZADO', ['COMENTAR']],
])('%s en %s', (who, estado, expected) => {
  expect([...availableActions(solicitud(estado), USERS[who])].sort()).toEqual([...expected].sort());
});

test('encuesta ya respondida no se ofrece', () => {
  const actions = availableActions(solicitud('CERRADO', { encuestaRespondida: true }), USERS['ESTUDIANTE propietario']);
  expect(actions.has('RESPONDER_ENCUESTA')).toBe(false);
  expect(actions.has('COMENTAR')).toBe(true);
});
