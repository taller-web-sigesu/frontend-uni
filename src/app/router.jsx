import { Navigate, Outlet, createBrowserRouter } from 'react-router';
import { ROUTES } from './routes.jsx';
import { AppShell } from '../components/layout/AppShell.jsx';
import { PublicLayout } from '../components/layout/PublicLayout.jsx';
import { useCurrentUser } from './userContext.js';
import NotFoundPage from './NotFoundPage.jsx';
import { navigationFor } from './navigation.js';

const noLogout = () => undefined;

/** La raíz lleva a la primera pantalla del menú del rol (el supervisor no tiene /inicio). */
function RootRedirect() {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={navigationFor(user.rol)[0].to} replace />;
}

function AuthenticatedLayout({ useLogout }) {
  const user = useCurrentUser();
  const onLogout = useLogout();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <AppShell user={user} onLogout={onLogout}>
      <Outlet />
    </AppShell>
  );
}

/** Envuelve `element` con el guarda si existe (las pruebas sin sesión no lo pasan). */
function wrap(Guard, element) {
  return Guard ? <Guard>{element}</Guard> : element;
}

function toRouteObject(route, { guard, sessionGuard, publicGuard }) {
  const Guard = guard;
  return {
    path: route.path,
    handle: { title: route.title, roles: route.roles },
    lazy: async () => {
      const { default: Page } = await route.lazy();
      if (route.roles && Guard) {
        return { Component: function GuardedPage() { return <Guard roles={route.roles}><Page /></Guard>; } };
      }
      const Outer = route.requiresSession ? sessionGuard : (!route.roles ? publicGuard : null);
      if (Outer) {
        return { Component: function GuardedPage() { return wrap(Outer, <Page />); } };
      }
      return { Component: Page };
    },
  };
}

/**
 * Árbol de rutas compartido por el router del navegador y el de las pruebas.
 * - `guard({ roles })` envuelve cada página con rol (RequireRole).
 * - `sessionGuard` envuelve la raíz, el layout autenticado y las rutas `requiresSession`.
 * - `publicGuard` envuelve las rutas públicas (/login, /registro).
 * - `useLogout()` devuelve la acción de «Cerrar sesión» del topbar.
 */
export function buildRouteObjects({
  routes = ROUTES, guard, sessionGuard, publicGuard, useLogout = () => noLogout,
} = {}) {
  const guards = { guard, sessionGuard, publicGuard };
  return [
    { path: '/', element: wrap(sessionGuard, <RootRedirect />) },
    {
      element: <PublicLayout />,
      children: routes.filter((r) => !r.roles).map((r) => toRouteObject(r, guards)),
    },
    {
      element: wrap(sessionGuard, <AuthenticatedLayout useLogout={useLogout} />),
      children: [
        ...routes.filter((r) => r.roles).map((r) => toRouteObject(r, guards)),
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ];
}

export function createAppRouter(options = {}) {
  return createBrowserRouter(buildRouteObjects(options));
}
