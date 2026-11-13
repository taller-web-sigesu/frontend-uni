import { Outlet } from 'react-router';

export function PublicLayout() {
  return (
    <div className="public-layout">
      <main className="public-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
