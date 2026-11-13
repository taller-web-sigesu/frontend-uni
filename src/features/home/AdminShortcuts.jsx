import { Link } from 'react-router';

const SHORTCUTS = [
  { to: '/indicadores', label: 'Indicadores', description: 'Atención de solicitudes por rango y área' },
  { to: '/admin/usuarios', label: 'Usuarios', description: 'Cuentas, aprobaciones y contraseñas' },
  { to: '/admin/catalogos', label: 'Catálogos', description: 'Áreas, categorías, prioridades y estados' },
  { to: '/admin/sla', label: 'Políticas SLA', description: 'Plazos de atención por categoría o prioridad' },
  { to: '/reservas/aprobacion', label: 'Aprobación de reservas', description: 'Solicitudes de ambientes por revisar' },
];

/** Inicio del administrador: accesos directos (no ve solicitudes: el backend le responde 403). */
export function AdminShortcuts() {
  return (
    <section className="home-section card" aria-labelledby="accesos-rapidos">
      <h2 id="accesos-rapidos">Accesos rápidos</h2>
      <ul className="shortcut-list">
        {SHORTCUTS.map((item) => (
          <li key={item.to}>
            <Link className="shortcut-list__link" to={item.to}>{item.label}</Link>
            <p className="shortcut-list__description">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
