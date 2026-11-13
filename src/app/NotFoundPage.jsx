import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <section className="page">
      <h1>Página no encontrada</h1>
      <p>La dirección no existe o cambió.</p>
      <Link to="/">Volver al inicio</Link>
    </section>
  );
}
