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
  expect(within(screen.getByRole('banner')).queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
  await user.click(within(screen.getByRole('complementary')).getByRole('button', { name: 'Cerrar sesión' }));
  expect(onLogout).toHaveBeenCalledTimes(1);
});

test('contraer el menú mantiene los nombres accesibles, el foco y la opción activa', async () => {
  mockViewport(false);
  const user = userEvent.setup();
  renderWithRouter(<AppShell user={ana} onLogout={vi.fn()}><p>Contenido</p></AppShell>, { route: '/solicitudes' });
  const sidebar = screen.getByRole('complementary');
  const menu = within(sidebar).getByRole('navigation', { name: 'Menú principal' });
  const toggle = within(sidebar).getByRole('button', { name: 'Contraer menú' });
  expect(toggle).toHaveAttribute('aria-controls', menu.id);
  await user.click(toggle);
  expect(sidebar).toHaveClass('sidebar--collapsed');
  expect(toggle).toHaveAccessibleName('Expandir menú');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(toggle).toHaveFocus();
  expect(within(menu).getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute('aria-current', 'page');
  expect(within(sidebar).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  await user.keyboard('{Enter}');
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(sidebar).not.toHaveClass('sidebar--collapsed');
});

test('el enlace para saltar la navegación enfoca el contenido', async () => {
  mockViewport(false);
  const user = userEvent.setup();
  renderWithRouter(<AppShell user={ana}><p>Contenido</p></AppShell>, { route: '/inicio' });
  await user.tab();
  expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('main')).toHaveFocus();
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

test('la raíz lleva a la primera pantalla permitida del rol', async () => {
  mockViewport(false);
  const supervisora = { id: '2', nombreCompleto: 'Supervisora TI Demo', rol: 'SUPERVISOR', areaId: '1' };
  const { router } = renderWithRouter(null, { route: '/', user: supervisora });
  expect(await screen.findByRole('heading', { name: 'Indicadores' })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/indicadores');
});

test('el logo navega dentro de la aplicación sin recargar', () => {
  mockViewport(false);
  renderWithRouter(<AppShell user={ana}><p>Contenido</p></AppShell>, { route: '/solicitudes' });
  const logo = within(screen.getByRole('complementary')).getByRole('link', { name: 'UNMSM, inicio' });
  expect(logo).toHaveAttribute('href', '/');
  expect(logo).toHaveAttribute('data-discover', 'true');
});

test('el nombre accesible del logo contiene su texto visible (WCAG 2.5.3)', () => {
  mockViewport(false);
  renderWithRouter(<AppShell user={ana}><p>Contenido</p></AppShell>, { route: '/inicio' });
  const brand = screen.getByRole('link', { name: 'UNMSM, inicio' });
  expect(brand).toHaveTextContent('UNMSM');
});
