import { ROLE_LABELS } from '../../services/format.js';
import { Button } from '../ui/index.js';

export function Topbar({ user, onLogout, menuButton }) {
  return (
    <header className="topbar">
      <div className="topbar__start">
        {menuButton}
        <a className="brand" href="/" aria-label="Universidad Actúa, inicio">
          <span className="brand__mark" aria-hidden="true">U</span>
          <span className="brand__name">Universidad <strong>Actúa</strong></span>
        </a>
      </div>
      <div className="topbar__user">
        <span className="topbar__identity">
          <span className="topbar__name">{user.nombreCompleto}</span>
          <span className="topbar__role">{ROLE_LABELS[user.rol] || user.rol}</span>
        </span>
        {onLogout && <Button variant="ghost" onClick={onLogout}>Cerrar sesión</Button>}
      </div>
    </header>
  );
}
