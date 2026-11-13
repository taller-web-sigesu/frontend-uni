// Datos ficticios deterministas de la API simulada. Sin dependencias de MSW,
// para que pendingContract pueda leerlos sin arrastrar MSW al bundle.
// Usuarios, roles y áreas replican backend-uni/docs/INTEGRACION-FRONTEND.md.

import { todayInLima } from '../services/format.js';

export const DEMO_PASSWORD = 'Demo2026!';

const TERMINAL = ['CERRADO', 'RECHAZADO'];
const FLOW = ['NUEVO', 'ASIGNADO', 'EN_PROCESO', 'RESUELTO'];

/**
 * Solicitudes en todos los estados para Ana (8) y Pedro (9). Cada una lleva
 * dentro su historial, comentarios, evidencias, auditoría y encuesta.
 * `responsableId` es la asignación vigente; en terminales queda en `ultimoResponsableId`.
 */
function initialRequests() {
  const seeds = [
    { id: '1', solicitanteId: '8', categoriaId: '3', areaId: '1', prioridadId: '4', estado: 'NUEVO', ubicacion: 'Pabellón B, aula 204', descripcion: 'El aula no tiene conexión Wi-Fi.' },
    { id: '2', solicitanteId: '8', categoriaId: '5', areaId: '1', prioridadId: '5', estado: 'ASIGNADO', responsableId: '5', ubicacion: 'Laboratorio 3', descripcion: 'La PC 12 no enciende.' },
    { id: '3', solicitanteId: '8', categoriaId: '3', areaId: '1', prioridadId: '4', estado: 'EN_PROCESO', responsableId: '5', ubicacion: 'Biblioteca central, sala 2', descripcion: 'El Wi-Fi se desconecta cada pocos minutos.' },
    { id: '4', solicitanteId: '8', categoriaId: '5', areaId: '1', prioridadId: '3', estado: 'RESUELTO', responsableId: '6', ubicacion: 'Aula 101', descripcion: 'El proyector no detecta la laptop.' },
    { id: '5', solicitanteId: '8', categoriaId: '3', areaId: '1', prioridadId: '4', estado: 'CERRADO', ultimoResponsableId: '5', ubicacion: 'Pabellón A, aula 110', descripcion: 'No hay señal en el aula.' },
    { id: '6', solicitanteId: '8', categoriaId: '6', areaId: '2', prioridadId: '3', estado: 'RECHAZADO', motivoRechazo: 'El servicio corresponde a otra sede.', ubicacion: 'Sede Norte', descripcion: 'La puerta del aula no cierra.' },
    { id: '7', solicitanteId: '9', categoriaId: '6', areaId: '2', prioridadId: '3', estado: 'ASIGNADO', responsableId: '7', ubicacion: 'Pabellón C, aula 305', descripcion: 'Una ventana está rota.' },
    { id: '8', solicitanteId: '9', categoriaId: '3', areaId: '1', prioridadId: '4', estado: 'CERRADO', ultimoResponsableId: '6', ubicacion: 'Sala de docentes', descripcion: 'La impresora de red no aparece.' },
    { id: '9', solicitanteId: '9', categoriaId: '5', areaId: '1', prioridadId: '3', estado: 'NUEVO', ubicacion: 'Oficina 12', descripcion: 'El monitor parpadea.' },
  ];
  return seeds.map((seed, index) => {
    const day = String(index + 2).padStart(2, '0');
    const creadoEn = `2026-11-${day}T14:00:00Z`;
    const reached = TERMINAL.includes(seed.estado)
      ? [...FLOW.slice(0, seed.estado === 'CERRADO' ? 4 : 1), seed.estado]
      : FLOW.slice(0, FLOW.indexOf(seed.estado) + 1);
    const responsable = seed.responsableId || seed.ultimoResponsableId;
    const history = reached.map((estado, step) => ({
      estadoAnterior: step === 0 ? null : reached[step - 1],
      estado,
      actorId: step === 0 ? seed.solicitanteId : (estado === 'EN_PROCESO' || estado === 'RESUELTO' ? responsable : '2'),
      fecha: `2026-11-${day}T${String(14 + step).padStart(2, '0')}:00:00Z`,
      motivo: estado === 'RECHAZADO' ? seed.motivoRechazo : null,
    }));
    const { motivoRechazo, ...rest } = seed;
    void motivoRechazo;
    return {
      responsableId: null,
      ultimoResponsableId: null,
      ...rest,
      codigo: `SOL-2026-${String(seed.id).padStart(6, '0')}`,
      creadoEn,
      sla: {
        estado: TERMINAL.includes(seed.estado) ? 'CERRADA' : (index % 3 === 2 ? 'POR_VENCER' : 'EN_PLAZO'),
        fechaAviso: `2026-11-${String(index + 3).padStart(2, '0')}T10:00:00Z`,
        fechaLimite: `2026-11-${String(index + 3).padStart(2, '0')}T14:00:00Z`,
      },
      history,
      comments: seed.id === '3'
        ? [{ id: '1', contenido: 'Ya revisé el punto de acceso.', autorId: '5', creadoEn: `2026-11-${day}T17:00:00Z` }]
        : [],
      attachments: seed.id === '2'
        ? [{ id: '1', nombre: 'pc-12.jpg', tamanoBytes: 2097152, tipoMime: 'image/jpeg', autorId: '8', creadoEn: `2026-11-${day}T14:05:00Z`, eliminado: false }]
        : [],
      audit: seed.id === '2'
        ? [{ id: '1', campo: 'prioridad', valorAnterior: 'Media', valorNuevo: 'Alta', actorId: '2', fecha: `2026-11-${day}T15:30:00Z` }]
        : [],
      survey: null,
    };
  });
}

const addDays = (day, days) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/**
 * Reservas con fechas relativas al día de Lima, para que sigan en el futuro.
 * Ana (8) en los cuatro estados; Pedro (9) y la supervisora de TI (2) con
 * pendientes. El Laboratorio 204 (área TI) concentra las pendientes del día +3.
 */
function initialReservationData() {
  const today = todayInLima();
  const creadoEn = `${addDays(today, -1)}T15:00:00Z`;
  const decididoEn = `${addDays(today, -1)}T18:00:00Z`;
  const allDays = (horaApertura, horaCierre, days = [1, 2, 3, 4, 5, 6, 7]) => days.map((diaSemana) => ({ diaSemana, horaApertura, horaCierre }));
  const seeds = [
    { id: '1', solicitanteId: '8', espacioId: '3', dia: 3, horaInicio: '10:00', horaFin: '11:00', estado: 'PENDIENTE', motivo: 'Sesión de laboratorio', numAsistentes: 18 },
    { id: '2', solicitanteId: '8', espacioId: '2', dia: 4, horaInicio: '09:00', horaFin: '10:00', estado: 'CONFIRMADA', motivo: 'Repaso de cálculo', numAsistentes: 25, actorId: '1' },
    { id: '3', solicitanteId: '8', espacioId: '2', dia: 2, horaInicio: '15:00', horaFin: '16:00', estado: 'RECHAZADA', motivo: 'Taller de oratoria', numAsistentes: null, actorId: '1', motivoRechazo: 'El aula está reservada para exámenes.' },
    { id: '4', solicitanteId: '8', espacioId: '3', dia: 1, horaInicio: '08:00', horaFin: '09:00', estado: 'CANCELADA', motivo: 'Práctica de redes', numAsistentes: 5, actorId: '8' },
    { id: '5', solicitanteId: '9', espacioId: '3', dia: 3, horaInicio: '14:00', horaFin: '16:00', estado: 'PENDIENTE', motivo: 'Clase práctica', numAsistentes: 20 },
    { id: '6', solicitanteId: '2', espacioId: '3', dia: 5, horaInicio: '09:00', horaFin: '10:00', estado: 'PENDIENTE', motivo: 'Reunión de área', numAsistentes: 8 },
    { id: '7', solicitanteId: '9', espacioId: '4', dia: 3, horaInicio: '10:00', horaFin: '11:00', estado: 'PENDIENTE', motivo: 'Mantenimiento preventivo', numAsistentes: null },
  ];
  return {
    spaceTypes: [
      { id: '1', codigo: 'AULA', nombre: 'Aula', descripcion: 'Aula de clases', activo: true },
      { id: '2', codigo: 'LAB', nombre: 'Laboratorio', descripcion: null, activo: true },
      { id: '3', codigo: 'AUD', nombre: 'Auditorio', descripcion: null, activo: false },
    ],
    spaces: [
      { id: '1', codigo: 'A-101', nombre: 'Aula 101', tipoEspacioId: '1', areaId: null, pabellon: 'A', piso: '1', capacidad: 40 },
      { id: '2', codigo: 'A-102', nombre: 'Aula 102', tipoEspacioId: '1', areaId: null, pabellon: 'A', piso: '1', capacidad: 30 },
      { id: '3', codigo: 'LAB-204', nombre: 'Laboratorio 204', tipoEspacioId: '2', areaId: '1', pabellon: 'B', piso: '2', capacidad: 24 },
      { id: '4', codigo: 'LAB-301', nombre: 'Laboratorio 301', tipoEspacioId: '2', areaId: '2', pabellon: 'C', piso: '3', capacidad: 20 },
      { id: '5', codigo: 'A-001', nombre: 'Aula antigua', tipoEspacioId: '1', areaId: null, pabellon: 'A', piso: '0', capacidad: 15, activo: false },
    ].map((space) => ({ descripcion: null, ubicacionDetallada: null, requiereAprobacion: true, activo: true, ...space })),
    // Una franja por día (1 = lunes … 7 = domingo). El Aula 101 cierra el domingo.
    spaceSchedules: {
      1: allDays('08:00', '20:00', [1, 2, 3, 4, 5, 6]),
      2: allDays('07:00', '22:00'),
      3: allDays('08:00', '18:00'),
      4: allDays('08:00', '20:00'),
      5: [],
    },
    reservations: seeds.map(({ dia, actorId, ...seed }) => {
      const history = [{ estadoAnterior: null, estado: 'PENDIENTE', actorId: seed.solicitanteId, fecha: creadoEn, motivo: null }];
      if (seed.estado !== 'PENDIENTE') {
        history.push({ estadoAnterior: 'PENDIENTE', estado: seed.estado, actorId, fecha: decididoEn, motivo: seed.motivoRechazo || null });
      }
      return {
        motivoRechazo: null,
        ...seed,
        codigo: `RES-2026-${seed.id.padStart(6, '0')}`,
        fecha: addDays(today, dia),
        creadoEn,
        history,
      };
    }),
    // Valores semilla del backend (reservas.md).
    reservationPolicy: {
      duracionMinimaMinutos: 30,
      duracionMaximaMinutos: 240,
      horasAnticipacionMinima: 1,
      diasAnticipacionMaxima: 30,
      maxReservasActivasPorDia: 2,
    },
  };
}

function initialData() {
  return {
    areas: [
      { id: '1', codigo: 'TI', nombre: 'Tecnologías de la Información', activo: true },
      { id: '2', codigo: 'MANT', nombre: 'Mantenimiento', activo: true },
      { id: '3', codigo: 'SG', nombre: 'Servicios Generales', activo: false },
      { id: '4', codigo: 'BIB', nombre: 'Biblioteca', activo: true },
    ],
    priorities: [
      { id: '3', codigo: 'BAJA', nombre: 'Baja', nivel: 1, activo: true },
      { id: '4', codigo: 'MEDIA', nombre: 'Media', nivel: 2, activo: true },
      { id: '5', codigo: 'ALTA', nombre: 'Alta', nivel: 3, activo: true },
    ],
    categories: [
      { id: '3', codigo: 'WIFI', nombre: 'Conectividad', areaId: '1', prioridadPredeterminadaId: '4', activo: true },
      { id: '5', codigo: 'PC', nombre: 'Equipos de cómputo', areaId: '1', prioridadPredeterminadaId: '4', activo: true },
      { id: '6', codigo: 'INFRA', nombre: 'Infraestructura', areaId: '2', prioridadPredeterminadaId: '3', activo: true },
      { id: '7', codigo: 'LIBROS', nombre: 'Préstamo de libros', areaId: '4', prioridadPredeterminadaId: '3', activo: true },
      { id: '8', codigo: 'MOB', nombre: 'Mobiliario antiguo', areaId: '2', prioridadPredeterminadaId: '3', activo: false },
    ],
    requestStatuses: [
      { id: '1', codigo: 'NUEVO', nombre: 'Nuevo', esFinal: false },
      { id: '2', codigo: 'ASIGNADO', nombre: 'Asignado', esFinal: false },
      { id: '3', codigo: 'EN_PROCESO', nombre: 'En proceso', esFinal: false },
      { id: '4', codigo: 'RESUELTO', nombre: 'Resuelto', esFinal: false },
      { id: '5', codigo: 'CERRADO', nombre: 'Cerrado', esFinal: true },
      { id: '6', codigo: 'RECHAZADO', nombre: 'Rechazado', esFinal: true },
    ],
    users: [
      { id: '1', nombreCompleto: 'Admin Demo', correo: 'admin.demo@universidad.example', rol: 'ADMINISTRADOR', areaId: null },
      { id: '2', nombreCompleto: 'Supervisora TI Demo', correo: 'supervisor.ti.demo@universidad.example', rol: 'SUPERVISOR', areaId: '1' },
      { id: '3', nombreCompleto: 'Supervisor Mantenimiento Demo', correo: 'supervisor.mant.demo@universidad.example', rol: 'SUPERVISOR', areaId: '2' },
      { id: '4', nombreCompleto: 'Supervisora Biblioteca Demo', correo: 'supervisor.bib.demo@universidad.example', rol: 'SUPERVISOR', areaId: '4' },
      { id: '5', nombreCompleto: 'Técnico TI Demo', correo: 'tecnico.ti.demo@universidad.example', rol: 'TECNICO', areaId: '1' },
      { id: '6', nombreCompleto: 'Técnica TI Demo', correo: 'tecnica.ti.demo@universidad.example', rol: 'TECNICO', areaId: '1' },
      { id: '7', nombreCompleto: 'Técnico Mantenimiento Demo', correo: 'tecnico.mant.demo@universidad.example', rol: 'TECNICO', areaId: '2' },
      { id: '8', nombreCompleto: 'Ana Demo', correo: 'ana.demo@universidad.example', rol: 'ESTUDIANTE', areaId: null },
      { id: '9', nombreCompleto: 'Pedro Demo', correo: 'pedro.demo@universidad.example', rol: 'DOCENTE', areaId: null },
      // Solo en la API simulada: primer ingreso y cuentas auto-registradas sin aprobar.
      { id: '10', nombreCompleto: 'Nuevo Demo', correo: 'nuevo.demo@universidad.example', rol: 'ESTUDIANTE', areaId: null, debeCambiarContrasena: true },
      { id: '11', nombreCompleto: 'Lucía Pendiente', correo: 'lucia.pendiente@unmsm.edu.pe', rol: 'ESTUDIANTE', areaId: null, estadoCuenta: 'PENDIENTE', origenRegistro: 'AUTOREGISTRO', creadoEn: '2026-11-10T09:00:00Z' },
      { id: '12', nombreCompleto: 'Rosa Rechazada', correo: 'rosa.rechazada@unmsm.edu.pe', rol: 'ESTUDIANTE', areaId: null, estadoCuenta: 'RECHAZADA', origenRegistro: 'AUTOREGISTRO' },
      { id: '13', nombreCompleto: 'Mario Pendiente', correo: 'mario.pendiente@unmsm.edu.pe', rol: 'ESTUDIANTE', areaId: null, estadoCuenta: 'PENDIENTE', origenRegistro: 'AUTOREGISTRO', creadoEn: '2026-11-12T15:30:00Z' },
      { id: '14', nombreCompleto: 'Iris Inactiva', correo: 'iris.inactiva@universidad.example', rol: 'DOCENTE', areaId: null, activo: false },
    ].map((user) => ({
      telefono: null,
      activo: true,
      estadoCuenta: 'ACTIVA',
      origenRegistro: 'ADMINISTRADOR',
      creadoEn: '2026-11-01T13:00:00Z',
      contrasena: DEMO_PASSWORD,
      debeCambiarContrasena: false,
      ...user,
    })),
    requests: initialRequests(),
    // Políticas SLA: una por categoría (Conectividad) y una por prioridad (Alta).
    slaPolicies: [
      { id: '1', categoriaId: '3', prioridadId: null, horasObjetivo: 24, horasAviso: 4, vigenteDesde: '2026-11-01T05:00:00Z', vigenteHasta: null, activo: true },
      { id: '2', categoriaId: null, prioridadId: '5', horasObjetivo: 8, horasAviso: 2, vigenteDesde: '2026-11-01T05:00:00Z', vigenteHasta: null, activo: true },
    ],
    ...initialReservationData(),
    // Sesiones simuladas: el navegador tiene una sola cookie `refresh_token`.
    sessions: [],
    refreshCookie: null,
    loginFailures: {},
    sequence: 100,
  };
}

export const db = initialData();

/** Restaura el estado inicial sin cambiar la identidad del objeto `db`. */
export function resetDb() {
  const fresh = initialData();
  Object.keys(db).forEach((key) => delete db[key]);
  Object.assign(db, fresh);
}
