import { ROUTES } from './routes.jsx';
import { navigationFor } from './navigation.js';

const PUBLIC = ['/login', '/registro', '/cambiar-contrasena'];
const ALL_ROLES = ['ESTUDIANTE', 'DOCENTE', 'TECNICO', 'SUPERVISOR', 'ADMINISTRADOR'];

function rolesOf(path) {
  return ROUTES.find((route) => route.path === path)?.roles;
}

test('cada ruta autenticada declara roles', () => {
  ROUTES.filter((r) => !PUBLIC.includes(r.path))
    .forEach((r) => expect(r.roles?.length, r.path).toBeGreaterThan(0));
});

test('las rutas públicas no exigen rol y todas cargan bajo demanda', () => {
  PUBLIC.forEach((path) => expect(rolesOf(path)).toBeNull());
  ROUTES.forEach((r) => {
    expect(typeof r.lazy, r.path).toBe('function');
    expect(r.title, r.path).toBeTruthy();
  });
});

test('roles por ruta según el plan', () => {
  expect(rolesOf('/solicitudes')).toEqual(['ESTUDIANTE', 'DOCENTE']);
  expect(rolesOf('/solicitudes/:id')).toEqual(['ESTUDIANTE', 'DOCENTE', 'TECNICO', 'SUPERVISOR']);
  expect(rolesOf('/bandeja')).toEqual(['TECNICO']);
  expect(rolesOf('/gestion')).toEqual(['SUPERVISOR']);
  expect(rolesOf('/indicadores')).toEqual(['SUPERVISOR', 'ADMINISTRADOR']);
  expect(rolesOf('/reservas/nueva')).toEqual(ALL_ROLES);
  expect(rolesOf('/reservas/aprobacion')).toEqual(['SUPERVISOR', 'ADMINISTRADOR']);
  expect(rolesOf('/admin/ambientes')).toEqual(['ADMINISTRADOR']);
  expect(rolesOf('/inicio')).toEqual(['ESTUDIANTE', 'DOCENTE', 'TECNICO', 'ADMINISTRADOR']);
  expect(rolesOf('/perfil')).toEqual(ALL_ROLES);
});

test('navigationFor(ESTUDIANTE) y DOCENTE son iguales', () => {
  expect(navigationFor('DOCENTE')).toEqual(navigationFor('ESTUDIANTE'));
  expect(navigationFor('ESTUDIANTE').map((i) => i.to)).toContain('/solicitudes');
});

test('navigationFor(ADMINISTRADOR) incluye Usuarios, Catálogos, SLA, Ambientes e Indicadores', () => {
  const labels = navigationFor('ADMINISTRADOR').map((i) => i.label);
  ['Usuarios', 'Catálogos', 'SLA', 'Ambientes', 'Indicadores'].forEach((label) => expect(labels).toContain(label));
});

test('navigationFor(TECNICO) no incluye Gestión ni Administración', () => {
  const items = navigationFor('TECNICO');
  expect(items.some((i) => i.label.includes('Gestión'))).toBe(false);
  expect(items.some((i) => i.to.startsWith('/admin'))).toBe(false);
  expect(items.map((i) => i.to)).toContain('/bandeja');
});

test('cada enlace del menú apunta a una ruta permitida para ese rol', () => {
  ALL_ROLES.forEach((rol) => {
    navigationFor(rol).forEach((item) => {
      expect(rolesOf(item.to), `${rol} → ${item.to}`).toContain(rol);
    });
  });
});
