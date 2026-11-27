const INICIO = { to: '/inicio', label: 'Inicio', icon: 'home' };
const INDICADORES = { to: '/indicadores', label: 'Indicadores', icon: 'chart' };
const PERFIL = { to: '/perfil', label: 'Perfil', icon: 'profile' };
const RESERVAS = { to: '/reservas', label: 'Mis reservas', icon: 'calendar' };
const APROBACION = { to: '/reservas/aprobacion', label: 'Aprobación de reservas', icon: 'calendar' };

const SOLICITANTE = [
  INICIO,
  { to: '/solicitudes', label: 'Mis solicitudes', icon: 'list' },
  RESERVAS,
  PERFIL,
];

const MENUS = {
  ESTUDIANTE: SOLICITANTE,
  DOCENTE: SOLICITANTE,
  TECNICO: [
    INICIO,
    { to: '/bandeja', label: 'Mis asignaciones', icon: 'list' },
    RESERVAS,
    PERFIL,
  ],
  SUPERVISOR: [
    INDICADORES,
    { to: '/gestion', label: 'Gestión de área', icon: 'list' },
    APROBACION,
    RESERVAS,
    PERFIL,
  ],
  ADMINISTRADOR: [
    INICIO,
    INDICADORES,
    { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
    { to: '/admin/catalogos', label: 'Catálogos', icon: 'catalog' },
    { to: '/admin/sla', label: 'SLA', icon: 'clock' },
    { to: '/admin/ambientes', label: 'Ambientes', icon: 'building' },
    APROBACION,
    PERFIL,
  ],
};

/** Menú lateral por rol; el docente usa el mismo menú que el estudiante (decisiones 02). */
export function navigationFor(rol) {
  return MENUS[rol] || [PERFIL];
}
