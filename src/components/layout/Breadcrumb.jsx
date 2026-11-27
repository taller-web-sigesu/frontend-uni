import { Link } from 'react-router';

export function Breadcrumb({ current }) {
  return (
    <nav className="breadcrumb" aria-label="Ruta de navegación">
      <ol>
        <li><Link to="/inicio">Inicio</Link></li>
        <li>
          <span className="breadcrumb__separator" aria-hidden="true">/</span>
          <span aria-current="page">{current}</span>
        </li>
      </ol>
    </nav>
  );
}
