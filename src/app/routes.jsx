const ESTUDIANTE = 'ESTUDIANTE';
const DOCENTE = 'DOCENTE';
const TECNICO = 'TECNICO';
const SUPERVISOR = 'SUPERVISOR';
const ADMINISTRADOR = 'ADMINISTRADOR';

export const ALL_ROLES = [ESTUDIANTE, DOCENTE, TECNICO, SUPERVISOR, ADMINISTRADOR];
const SOLICITANTES = [ESTUDIANTE, DOCENTE];

// Cada fase reemplaza `placeholder` por el import de su feature.
const placeholder = () => import('./PlaceholderPage.jsx');
const auth = (name) => () => import('../features/auth/index.js').then((m) => ({ default: m[name] }));
const requests = (name) => () => import('../features/requests/index.js').then((m) => ({ default: m[name] }));
const management = (name) => () => import('../features/management/index.js').then((m) => ({ default: m[name] }));
const home = () => import('../features/home/index.js').then((m) => ({ default: m.HomePage }));

/**
 * Tabla única de rutas. `roles: null` = pública (o de sesión restringida).
 * El guarda de la fase 02 usa `roles` para bloquear enlaces directos.
 */
export const ROUTES = [
  { path: '/login', roles: null, title: 'Iniciar sesión', lazy: auth('LoginPage') },
  { path: '/registro', roles: null, title: 'Crear cuenta', lazy: auth('RegisterPage') },
  // Sin rol pero con sesión (también la de primer ingreso).
  { path: '/cambiar-contrasena', roles: null, requiresSession: true, title: 'Cambiar contraseña', lazy: auth('ChangePasswordPage') },
  { path: '/inicio', roles: [ESTUDIANTE, DOCENTE, TECNICO, ADMINISTRADOR], title: 'Inicio', lazy: home },
  { path: '/perfil', roles: ALL_ROLES, title: 'Perfil', lazy: auth('ProfilePage') },
  { path: '/solicitudes', roles: SOLICITANTES, title: 'Mis solicitudes', lazy: requests('MyRequestsPage') },
  { path: '/solicitudes/nueva', roles: SOLICITANTES, title: 'Registrar solicitud', lazy: requests('NewRequestPage') },
  { path: '/solicitudes/:id', roles: [...SOLICITANTES, TECNICO, SUPERVISOR], title: 'Detalle y seguimiento de solicitud', lazy: requests('RequestDetailPage') },
  { path: '/bandeja', roles: [TECNICO], title: 'Mis asignaciones', lazy: management('TechnicianInboxPage') },
  { path: '/gestion', roles: [SUPERVISOR], title: 'Gestión de área', lazy: management('AreaManagementPage') },
  { path: '/indicadores', roles: [SUPERVISOR, ADMINISTRADOR], title: 'Indicadores', lazy: placeholder },
  { path: '/reservas', roles: ALL_ROLES, title: 'Mis reservas', lazy: placeholder },
  { path: '/reservas/nueva', roles: ALL_ROLES, title: 'Registrar reserva', lazy: placeholder },
  { path: '/reservas/aprobacion', roles: [SUPERVISOR, ADMINISTRADOR], title: 'Aprobación de reservas', lazy: placeholder },
  { path: '/reservas/:id', roles: ALL_ROLES, title: 'Detalle de reserva', lazy: placeholder },
  { path: '/admin/usuarios', roles: [ADMINISTRADOR], title: 'Administración de usuarios', lazy: placeholder },
  { path: '/admin/catalogos', roles: [ADMINISTRADOR], title: 'Catálogos', lazy: placeholder },
  { path: '/admin/sla', roles: [ADMINISTRADOR], title: 'Políticas SLA', lazy: placeholder },
  { path: '/admin/ambientes', roles: [ADMINISTRADOR], title: 'Administración de ambientes', lazy: placeholder },
];
