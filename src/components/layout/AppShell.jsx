import { useId, useRef, useState } from 'react';
import { Button, Dialog } from '../ui/index.js';
import { Icon } from '../ui/Icon.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { MOBILE_QUERY, useMediaQuery } from './useMediaQuery.js';

export function AppShell({ user, onLogout, children }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navId = useId();
  const mainRef = useRef(null);

  const menuButton = isMobile ? (
    <Button variant="ghost" className="menu-toggle" aria-label="Abrir menú" aria-haspopup="dialog"
      aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
      <Icon name="menu" />
    </Button>
  ) : null;

  return (
    <div className="shell">
      <a className="skip-link" href="#contenido" tabIndex={0} onClick={(event) => {
        event.preventDefault();
        mainRef.current.focus();
      }}>Saltar al contenido</a>
      {!isMobile && (
        <aside className={collapsed ? 'sidebar sidebar--collapsed' : 'sidebar'}>
          <Sidebar rol={user.rol} onLogout={onLogout} navId={navId} collapsed={collapsed}
            onToggle={() => setCollapsed((value) => !value)} />
        </aside>
      )}
      <div className="shell__main">
        <Topbar user={user} menuButton={menuButton} />
        <main className="shell__content" id="contenido" ref={mainRef} tabIndex={-1}>{children}</main>
      </div>
      {isMobile && (
        <Dialog open={menuOpen} title="Menú" onClose={() => setMenuOpen(false)} className="dialog--drawer">
          <div className="sidebar sidebar--drawer">
            <Sidebar rol={user.rol} label="Menú móvil" onNavigate={() => setMenuOpen(false)} onLogout={onLogout} />
          </div>
        </Dialog>
      )}
    </div>
  );
}
