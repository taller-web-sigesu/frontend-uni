const PERFIL = { to: '/perfil', label: 'Perfil' };
const RESERVAS = { to: '/reservas', label: 'Mis reservas' };
const APROBACION = { to: '/reservas/aprobacion', label: 'Aprobación de reservas' };

const SOLICITANTE = [
  { to: '/inicio', label: 'Inicio' },
  { to: '/solicitudes', label: 'Mis solicitudes' },
  RESERVAS,
  PERFIL,
];

const MENUS = {
  ESTUDIANTE: SOLICITANTE,
  DOCENTE: SOLICITANTE,
  TECNICO: [
    { to: '/inicio', label: 'Inicio' },
    { to: '/bandeja', label: 'Mis asignaciones' },
    RESERVAS,
    PERFIL,
  ],
  SUPERVISOR: [
    { to: '/indicadores', label: 'Indicadores' },
    { to: '/gestion', label: 'Gestión de área' },
    APROBACION,
    RESERVAS,
    PERFIL,
  ],
  ADMINISTRADOR: [
    { to: '/inicio', label: 'Inicio' },
    { to: '/indicadores', label: 'Indicadores' },
    { to: '/admin/usuarios', label: 'Usuarios' },
    { to: '/admin/catalogos', label: 'Catálogos' },
    { to: '/admin/sla', label: 'SLA' },
    { to: '/admin/ambientes', label: 'Ambientes' },
    APROBACION,
    PERFIL,
  ],
};

/** Menú lateral por rol; el docente usa el mismo menú que el estudiante (decisiones 02). */
export function navigationFor(rol) {
  return MENUS[rol] || [PERFIL];
}
