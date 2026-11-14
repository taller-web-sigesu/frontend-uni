import { Navigate, matchPath, useLocation } from 'react-router';
import { ROUTES } from '../../app/routes.jsx';
import { Skeleton } from '../../components/ui/index.js';
import ForbiddenPage from '../../app/ForbiddenPage.jsx';
import { homePathFor } from './homePath.js';
import { useSession } from './SessionProvider.jsx';

export { homePathFor };

export const CHANGE_PASSWORD_PATH = '/cambiar-contrasena';

function PageLoading() {
  return (
    <section className="page">
      <Skeleton lines={4} />
    </section>
  );
}

/** Exige sesión; en primer ingreso solo deja ver el cambio de contraseña. */
export function RequireSession({ children }) {
  const { status, mustChangePassword, loggedOut } = useSession();
  const location = useLocation();
  if (status === 'restoring') return <PageLoading />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={loggedOut ? undefined : { from: location }} />;
  if (mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }
  return children;
}

/** Bloquea enlaces directos a rutas de otro rol sin pedir datos al servidor. */
export function RequireRole({ roles, children }) {
  const { user } = useSession();
  if (!user || !roles.includes(user.rol)) return <ForbiddenPage rol={user?.rol} />;
  return children;
}

/** true si `pathname` corresponde a una ruta con rol que `rol` puede ver. */
export function canAccess(pathname, rol) {
  const route = ROUTES.find((r) => r.roles && matchPath({ path: r.path, end: true }, pathname));
  return Boolean(route?.roles.includes(rol));
}

/** Destino tras ingresar: cambio obligatorio, la página pedida si el rol la permite, o su inicio. */
export function destinationAfterLogin({ user, mustChangePassword }, from) {
  if (mustChangePassword) return CHANGE_PASSWORD_PATH;
  if (from?.pathname && canAccess(from.pathname, user.rol)) {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`;
  }
  return homePathFor(user.rol);
}

/**
 * /login y /registro: con sesión activa redirigen. Al terminar el ingreso es
 * este guarda (no la pantalla) quien navega, con el `from` que dejó RequireSession.
 */
export function PublicOnly({ children }) {
  const session = useSession();
  const location = useLocation();
  if (session.status === 'restoring') return <PageLoading />;
  if (session.status === 'authenticated') {
    return <Navigate to={destinationAfterLogin(session, location.state?.from)} replace />;
  }
  return children;
}

function useSessionLogout() {
  return useSession().logout;
}

/** Guardas que la app (y las pruebas con sesión) pasan a buildRouteObjects. */
export const appGuards = {
  guard: RequireRole,
  sessionGuard: RequireSession,
  publicGuard: PublicOnly,
  useLogout: useSessionLogout,
};
