import { useCurrentUser } from '../../app/userContext.js';
import { RequestsPreview } from './RequestsPreview.jsx';
import { AdminShortcuts } from './AdminShortcuts.jsx';
import { AdminSummary } from './AdminSummary.jsx';
import { ReservationsPreview } from './ReservationsPreview.jsx';

const WITH_REQUESTS = ['ESTUDIANTE', 'DOCENTE', 'TECNICO'];

/** Inicio por rol. Cada sección la completa su fase (03, 04 y 05) en su propio archivo. */
export function HomePage({ user: userProp }) {
  const contextUser = useCurrentUser();
  const user = userProp || contextUser;
  if (!user) return null;
  const isAdmin = user.rol === 'ADMINISTRADOR';
  const withRequests = WITH_REQUESTS.includes(user.rol);
  return (
    <section className="page">
      <h1>Hola, {user.nombreCompleto}</h1>
      {withRequests && <RequestsPreview user={user} />}
      {isAdmin && (
        <>
          <AdminSummary />
          <AdminShortcuts />
        </>
      )}
      {withRequests && <ReservationsPreview user={user} />}
    </section>
  );
}
