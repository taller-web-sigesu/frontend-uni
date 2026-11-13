import { NavLink } from 'react-router';
import { navigationFor } from '../../app/navigation.js';

export function Sidebar({ rol, onNavigate, label = 'Menú principal' }) {
  return (
    <nav className="sidebar__nav" aria-label={label}>
      <ul>
        {navigationFor(rol).map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end className="sidebar__link" onClick={onNavigate}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
