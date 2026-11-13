import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { downloadBlob } from '../../services/download.js';
import { renderWithRouter } from '../../test/render.jsx';
import { captureRequests, SUPERVISORA_TI, userById } from '../../test/users.js';

vi.mock('../../services/download.js', () => ({ downloadBlob: vi.fn() }));

const ADMIN = '1';
const SUMMARY = '/api/v1/dashboard/summary';

function renderAs(id) {
  return renderWithRouter(null, { route: '/indicadores', session: { user: userById(id) } });
}

/** Resumen fijo para pruebas que necesitan valores conocidos. */
function useSummary(overrides = {}) {
  server.use(http.get(SUMMARY, ({ request }) => {
    const params = new URL(request.url).searchParams;
    return HttpResponse.json({
      filtros: { fechaDesde: params.get('fechaDesde'), fechaHasta: params.get('fechaHasta'), areaId: params.get('areaId') },
      registradas: 10,
      pendientes: 4,
      atendidas: 6,
      porCategoria: [{ id: '3', total: 6 }],
      porPrioridad: [{ id: '4', total: 10 }],
      porResponsable: [{ id: '5', total: 7 }, { id: null, total: 3 }],
      promedioHorasAtencion: 18.44,
      porcentajeResueltas: 60,
      vencidas: { total: 1, porVencer: 2, disponible: true },
      ...overrides,
    });
  }));
}

beforeEach(() => vi.mocked(downloadBlob).mockReset());
afterEach(() => {
  server.events.removeAllListeners();
  vi.useRealTimers();
});

async function setRange(user, desde, hasta) {
  const from = screen.getByLabelText('Desde');
  const to = screen.getByLabelText('Hasta');
  await user.clear(from);
  await user.type(from, desde);
  await user.clear(to);
  await user.type(to, hasta);
}

test('carga el mes actual de Lima al entrar', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-13T12:00:00Z'));
  const calls = captureRequests('GET', SUMMARY);
  renderAs(SUPERVISORA_TI);
  expect(await screen.findByRole('heading', { name: 'Indicadores' })).toBeInTheDocument();
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].url.searchParams.get('fechaDesde')).toBe('2026-11-01T05:00:00Z');
  expect(calls[0].url.searchParams.get('fechaHasta')).toBe('2026-12-01T05:00:00Z');
  expect(screen.getByLabelText('Desde')).toHaveValue('2026-11-01');
  expect(screen.getByLabelText('Hasta')).toHaveValue('2026-11-30');
});

test('editar el rango no recarga hasta Aplicar', async () => {
  const calls = captureRequests('GET', SUMMARY);
  const user = userEvent.setup();
  renderAs(SUPERVISORA_TI);
  await screen.findByText('Registradas');
  await waitFor(() => expect(calls).toHaveLength(1));
  await setRange(user, '2026-10-01', '2026-10-31');
  expect(calls).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Aplicar' }));
  await waitFor(() => expect(calls).toHaveLength(2));
  expect(calls[1].url.searchParams.get('fechaDesde')).toBe('2026-10-01T05:00:00Z');
  expect(calls[1].url.searchParams.get('fechaHasta')).toBe('2026-11-01T05:00:00Z');
});

test('no aplica un rango invertido', async () => {
  const calls = captureRequests('GET', SUMMARY);
  const user = userEvent.setup();
  renderAs(SUPERVISORA_TI);
  await screen.findByText('Registradas');
  await setRange(user, '2026-11-20', '2026-11-10');
  expect(screen.getByText('La fecha final debe ser igual o posterior a la inicial')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  await user.clear(screen.getByLabelText('Hasta'));
  expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  expect(calls).toHaveLength(1);
});

test('exporta con los filtros aplicados', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-13T12:00:00Z'));
  const calls = captureRequests('GET', '/api/v1/dashboard/reports');
  const user = userEvent.setup();
  renderAs(SUPERVISORA_TI);
  await screen.findByText('Registradas');
  await setRange(user, '2026-10-01', '2026-10-31');
  await user.click(screen.getByRole('button', { name: 'Exportar solicitudes (CSV)' }));
  await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
  const params = calls[0].url.searchParams;
  expect(params.get('tipo')).toBe('solicitudes');
  expect(params.get('fechaDesde')).toBe('2026-11-01T05:00:00Z');
  expect(params.get('fechaHasta')).toBe('2026-12-01T05:00:00Z');
  expect(downloadBlob.mock.calls[0][0].filename).toBe('solicitudes.csv');

  await user.click(screen.getByRole('button', { name: 'Exportar indicadores (CSV)' }));
  await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(2));
  expect(calls[1].url.searchParams.get('tipo')).toBe('indicadores');
});

test('vencidas no disponibles muestra No disponible', async () => {
  useSummary({ vencidas: { total: 0, porVencer: 0, disponible: false } });
  renderAs(SUPERVISORA_TI);
  expect(await screen.findByText('No disponible')).toBeInTheDocument();
  expect(screen.getByText('18.4 h')).toBeInTheDocument();
  expect(screen.getByText('60.0 %')).toBeInTheDocument();
  expect(screen.getByText('6 de 10 solicitudes')).toBeInTheDocument();
});

test('el administrador elige Todas las áreas y no envía areaId', async () => {
  const calls = captureRequests('GET', SUMMARY);
  const user = userEvent.setup();
  renderAs(ADMIN);
  const area = await screen.findByLabelText('Área');
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0].url.searchParams.has('areaId')).toBe(false);
  await user.selectOptions(area, 'Mantenimiento');
  await waitFor(() => expect(calls.at(-1).url.searchParams.get('areaId')).toBe('2'));
  await user.selectOptions(area, 'Todas las áreas');
  await waitFor(() => expect(calls.at(-1).url.searchParams.has('areaId')).toBe(false));
});

test('el supervisor no ve selector de área', async () => {
  const calls = captureRequests('GET', SUMMARY);
  renderAs(SUPERVISORA_TI);
  await screen.findByText('Registradas');
  expect(screen.queryByLabelText('Área')).toBeNull();
  expect(calls[0].url.searchParams.has('areaId')).toBe(false);
});

test('muestra categorías sin nombre con respaldo', async () => {
  // 8 = categoría inactiva (fuera del catálogo habilitado), 99 = desconocida.
  useSummary({ porCategoria: [{ id: '8', total: 2 }, { id: '99', total: 1 }] });
  const { unmount } = renderAs(SUPERVISORA_TI);
  expect(await screen.findByText('Categoría 8')).toBeInTheDocument();
  expect(screen.getByText('Categoría 99')).toBeInTheDocument();
  unmount();

  renderAs(ADMIN);
  expect(await screen.findByText('Mobiliario antiguo')).toBeInTheDocument();
  expect(screen.getByText('Categoría 99')).toBeInTheDocument();
});

test('las barras exponen etiqueta y valor como texto', async () => {
  useSummary();
  renderAs(SUPERVISORA_TI);
  expect(await screen.findByRole('img', { name: 'Conectividad: 6' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Media: 10' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Sin asignar: 3' })).toBeInTheDocument();
  // El supervisor no tiene catálogo de usuarios: respaldo con el id.
  expect(screen.getByRole('img', { name: 'Responsable 5: 7' })).toBeInTheDocument();
  expect(screen.getByText('Conectividad')).toBeInTheDocument();
});

test('usa el nombre que trae cada grupo del resumen', async () => {
  // El backend (DashboardGroupResponse) incluye `nombre`: el supervisor no depende de catálogos.
  useSummary({
    porCategoria: [{ id: '8', nombre: 'Mobiliario antiguo', total: 2 }],
    porPrioridad: [{ id: '4', nombre: 'Normal', total: 10 }],
    porResponsable: [{ id: '5', nombre: 'Luis Técnico', total: 7 }, { id: null, nombre: null, total: 3 }],
  });
  renderAs(SUPERVISORA_TI);
  expect(await screen.findByRole('img', { name: 'Mobiliario antiguo: 2' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Normal: 10' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Luis Técnico: 7' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Sin asignar: 3' })).toBeInTheDocument();
});
