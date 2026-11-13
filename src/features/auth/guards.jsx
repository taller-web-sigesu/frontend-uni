import { Navigate, useLocation } from 'react-router';
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
  const { status, mustChangePassword } = useSession();
  const location = useLocation();
  if (status === 'restoring') return <PageLoading />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
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

/** /login y /registro: con sesión activa llevan al inicio del rol. */
export function PublicOnly({ children }) {
  const { status, user, mustChangePassword } = useSession();
  if (status === 'restoring') return <PageLoading />;
  if (status === 'authenticated') {
    return <Navigate to={mustChangePassword ? CHANGE_PASSWORD_PATH : homePathFor(user.rol)} replace />;
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
