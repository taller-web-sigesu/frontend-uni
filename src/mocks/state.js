// Datos ficticios deterministas de la API simulada. Sin dependencias de MSW,
// para que pendingContract pueda leerlos sin arrastrar MSW al bundle.
// Usuarios, roles y áreas replican backend-uni/docs/INTEGRACION-FRONTEND.md.

export const DEMO_PASSWORD = 'Demo2026!';

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
      { id: '11', nombreCompleto: 'Lucía Pendiente', correo: 'lucia.pendiente@unmsm.edu.pe', rol: 'ESTUDIANTE', areaId: null, estadoCuenta: 'PENDIENTE', origenRegistro: 'AUTOREGISTRO' },
      { id: '12', nombreCompleto: 'Rosa Rechazada', correo: 'rosa.rechazada@unmsm.edu.pe', rol: 'ESTUDIANTE', areaId: null, estadoCuenta: 'RECHAZADA', origenRegistro: 'AUTOREGISTRO' },
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
