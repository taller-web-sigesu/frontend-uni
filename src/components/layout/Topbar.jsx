import { ROLE_LABELS } from '../../services/format.js';

export function Topbar({ user, menuButton }) {
  return (
    <header className="topbar">
      {menuButton}
      <span className="topbar__identity">
        <span className="topbar__name">{user.nombreCompleto}</span>
        <span className="topbar__role">{ROLE_LABELS[user.rol] || user.rol}</span>
      </span>
    </header>
  );
}
