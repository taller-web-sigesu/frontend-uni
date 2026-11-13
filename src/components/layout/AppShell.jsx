import { useState } from 'react';
import { Dialog } from '../ui/index.js';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { MOBILE_QUERY, useMediaQuery } from './useMediaQuery.js';

export function AppShell({ user, onLogout, children }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuButton = isMobile ? (
    <button type="button" className="topbar__menu" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}>
      <span aria-hidden="true">&#9776;</span>
    </button>
  ) : null;

  return (
    <div className="shell">
      {!isMobile && (
        <aside className="sidebar">
          <Sidebar rol={user.rol} />
        </aside>
      )}
      <div className="shell__main">
        <Topbar user={user} onLogout={onLogout} menuButton={menuButton} />
        <main className="shell__content">{children}</main>
      </div>
      {isMobile && (
        <Dialog open={menuOpen} title="Menú" onClose={() => setMenuOpen(false)} className="dialog--drawer">
          <Sidebar rol={user.rol} label="Menú móvil" onNavigate={() => setMenuOpen(false)} />
        </Dialog>
      )}
    </div>
  );
}
