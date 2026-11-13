import { Link } from 'react-router';
import { homePathFor } from '../features/auth/homePath.js';

export default function ForbiddenPage({ rol }) {
  return (
    <section className="page">
      <h1>No tienes permiso para ver esta página</h1>
      <p>Tu rol no tiene acceso a esta sección.</p>
      <Link to={homePathFor(rol)}>Ir a mi inicio</Link>
    </section>
  );
}
