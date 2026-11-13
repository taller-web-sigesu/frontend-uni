import { Navigate, Outlet, createBrowserRouter } from 'react-router';
import { ROUTES } from './routes.jsx';
import { AppShell } from '../components/layout/AppShell.jsx';
import { PublicLayout } from '../components/layout/PublicLayout.jsx';
import { useCurrentUser } from './userContext.js';
import NotFoundPage from './NotFoundPage.jsx';

function AuthenticatedLayout({ onLogout }) {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <AppShell user={user} onLogout={onLogout}>
      <Outlet />
    </AppShell>
  );
}

function toRouteObject(route, guard) {
  const Guard = guard;
  return {
    path: route.path,
    handle: { title: route.title, roles: route.roles },
    lazy: async () => {
      const { default: Page } = await route.lazy();
      if (!Guard || !route.roles) return { Component: Page };
      return {
        Component: function GuardedPage() {
          return <Guard roles={route.roles}><Page /></Guard>;
        },
      };
    },
  };
}

/** Árbol de rutas compartido por el router del navegador y el de las pruebas. */
export function buildRouteObjects({ routes = ROUTES, guard, onLogout } = {}) {
  return [
    { path: '/', element: <Navigate to="/inicio" replace /> },
    {
      element: <PublicLayout />,
      children: routes.filter((r) => !r.roles).map((r) => toRouteObject(r, guard)),
    },
    {
      element: <AuthenticatedLayout onLogout={onLogout} />,
      children: [
        ...routes.filter((r) => r.roles).map((r) => toRouteObject(r, guard)),
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ];
}

export function createAppRouter(options = {}) {
  return createBrowserRouter(buildRouteObjects(options));
}
