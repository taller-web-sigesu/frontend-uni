import { Link, NavLink } from 'react-router';
import { navigationFor } from '../../app/navigation.js';
import { Icon } from '../ui/Icon.jsx';
import { Button } from '../ui/index.js';

export function Sidebar({ rol, onNavigate, onLogout, label = 'Menú principal', navId, collapsed = false, onToggle }) {
  const toggleLabel = collapsed ? 'Expandir menú' : 'Contraer menú';
  return (
    <>
      <div className="sidebar__header">
        <Link className="sidebar__brand" to="/" onClick={onNavigate} aria-label="UNMSM, inicio">
          UNMSM
        </Link>
        {onToggle && (
          <Button variant="ghost" className="menu-toggle" aria-label={toggleLabel} title={toggleLabel}
            aria-controls={navId} aria-expanded={!collapsed} onClick={onToggle}>
            <Icon name="sidebar" />
          </Button>
        )}
      </div>
      <nav id={navId} className="sidebar__nav" aria-label={label}>
        <ul>
          {navigationFor(rol).map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end className="sidebar__link" onClick={onNavigate}
                title={collapsed ? item.label : undefined}>
                <Icon name={item.icon} />
                <span className={collapsed ? 'visually-hidden' : undefined}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {onLogout && (
        <div className="sidebar__footer">
          <Button variant="ghost" onClick={onLogout} title={collapsed ? 'Cerrar sesión' : undefined}>
            <Icon name="logout" />
            <span className={collapsed ? 'visually-hidden' : undefined}>Cerrar sesión</span>
          </Button>
        </div>
      )}
    </>
  );
}
