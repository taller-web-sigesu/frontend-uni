import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell.jsx';
import { renderWithRouter } from '../../test/render.jsx';

const ana = { id: '8', nombreCompleto: 'Ana Demo', rol: 'ESTUDIANTE', areaId: null };

function mockViewport(mobile) {
  window.matchMedia = vi.fn((query) => ({
    matches: mobile && query.includes('max-width: 767px'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

afterEach(() => {
  delete window.matchMedia;
});

test('AppShell marca la ruta activa con aria-current', () => {
  mockViewport(false);
  renderWithRouter(<AppShell user={ana}><p>Contenido</p></AppShell>, { route: '/solicitudes' });
  const nav = screen.getByRole('navigation', { name: 'Menú principal' });
  expect(within(nav).getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute('aria-current', 'page');
  expect(within(nav).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  expect(screen.getByText('Ana Demo')).toBeInTheDocument();
  expect(screen.getByText('Estudiante')).toBeInTheDocument();
});

test('en móvil el menú se abre como diálogo y devuelve el foco', async () => {
  mockViewport(true);
  const user = userEvent.setup();
  renderWithRouter(<AppShell user={ana}><p>Contenido</p></AppShell>, { route: '/inicio' });
  expect(screen.queryByRole('navigation', { name: 'Menú principal' })).not.toBeInTheDocument();
  const abrir = screen.getByRole('button', { name: 'Abrir menú' });
  await user.click(abrir);
  const dialog = screen.getByRole('dialog', { name: 'Menú' });
  expect(within(dialog).getByRole('link', { name: 'Mis solicitudes' })).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog', { name: 'Menú' })).not.toBeInTheDocument();
  expect(abrir).toHaveFocus();
});

test('elegir un enlace en el menú móvil lo cierra', async () => {
  mockViewport(true);
  const user = userEvent.setup();
  renderWithRouter(<AppShell user={ana}><p>Contenido</p></AppShell>, { route: '/inicio' });
  await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
  await user.click(within(screen.getByRole('dialog', { name: 'Menú' })).getByRole('link', { name: 'Mis solicitudes' }));
  expect(screen.queryByRole('dialog', { name: 'Menú' })).not.toBeInTheDocument();
});

test('Cerrar sesión llama a onLogout', async () => {
  mockViewport(false);
  const user = userEvent.setup();
  const onLogout = vi.fn();
  renderWithRouter(<AppShell user={ana} onLogout={onLogout}><p>Contenido</p></AppShell>, { route: '/inicio' });
  await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(onLogout).toHaveBeenCalledTimes(1);
});

test('ruta desconocida muestra NotFoundPage', async () => {
  mockViewport(false);
  renderWithRouter(null, { route: '/no-existe', user: ana });
  expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
});

test('una ruta todavía no implementada muestra su título', async () => {
  mockViewport(false);
  renderWithRouter(null, { route: '/solicitudes', user: ana });
  expect(await screen.findByRole('heading', { name: 'Mis solicitudes' })).toBeInTheDocument();
});
