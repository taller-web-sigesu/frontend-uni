import { expect } from '@playwright/test';

/** `E2E_API=real` recorre el Compose de infra-uni; si no, la API simulada de `vite preview`. */
export const IS_REAL = process.env.E2E_API === 'real';

/** Contraseña de las cuentas de demostración (backend-uni/docs/INTEGRACION-FRONTEND.md). */
export const DEMO_PASSWORD = 'Demo2026!';

export const ACCOUNTS = {
  ESTUDIANTE: 'ana.demo@universidad.example',
  DOCENTE: 'pedro.demo@universidad.example',
  TECNICO: 'tecnico.ti.demo@universidad.example',
  SUPERVISOR: 'supervisor.ti.demo@universidad.example',
  ADMINISTRADOR: 'admin.demo@universidad.example',
};

/** Nombres visibles: la semilla real (db/demo) y la simulada no coinciden. */
export const NAMES = IS_REAL ? {
  ESTUDIANTE: 'Ana Estudiante',
  DOCENTE: 'Pedro Docente',
  TECNICO: 'Luis Técnico TI',
  SUPERVISOR: 'Sofía Supervisora TI',
  ADMINISTRADOR: 'Admin Demo',
} : {
  ESTUDIANTE: 'Ana Demo',
  DOCENTE: 'Pedro Demo',
  TECNICO: 'Técnico TI Demo',
  SUPERVISOR: 'Supervisora TI Demo',
  ADMINISTRADOR: 'Admin Demo',
};

export const homePathFor = (rol) => (rol === 'SUPERVISOR' ? '/indicadores' : '/inicio');

/** Sufijo único: en modo real los datos quedan en la base entre ejecuciones. */
export const unique = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export async function fillLogin(page, correo, contrasena) {
  await page.goto('/login');
  await page.getByLabel('Correo institucional').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

/** Ingresa con la cuenta de demostración del rol y espera su pantalla de inicio. */
export async function login(page, rol) {
  await fillLogin(page, ACCOUNTS[rol], DEMO_PASSWORD);
  await page.waitForURL(`**${homePathFor(rol)}`);
  await expect(page.getByText(NAMES[rol], { exact: true }).first()).toBeVisible();
}

export async function logout(page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
}

/** Ingreso directo contra el backend real (solo `E2E_API=real`). */
async function apiToken(request, correo, contrasena = DEMO_PASSWORD) {
  const response = await request.post('/api/v1/auth/login', { data: { correo, contrasena } });
  expect(response.status()).toBe(200);
  return (await response.json()).tokenAcceso;
}

/**
 * Cuenta que debe cambiar su contraseña al primer ingreso. En la API simulada
 * existe `nuevo.demo`; en la real se crea una nueva con el administrador.
 */
export async function firstLoginAccount(request) {
  if (!IS_REAL) return { correo: 'nuevo.demo@universidad.example', contrasena: DEMO_PASSWORD };
  const token = await apiToken(request, ACCOUNTS.ADMINISTRADOR);
  const correo = `e2e.${unique()}@unmsm.edu.pe`;
  const contrasena = 'Inicial2026';
  const response = await request.post('/api/v1/admin/users', {
    headers: { Authorization: `Bearer ${token}` },
    data: { nombreCompleto: 'Primer Ingreso E2E', correo, rol: 'ESTUDIANTE', contrasenaInicial: contrasena },
  });
  expect(response.status()).toBe(201);
  return { correo, contrasena };
}

/** Categoría del área de TI (la supervisora y el técnico de demostración son de TI). */
export const TI_CATEGORY = IS_REAL ? 'Soporte informático' : 'Conectividad';

/** PNG de 1×1 para adjuntar como evidencia. */
export const PNG = {
  name: 'evidencia.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
};

/** Registra una solicitud de TI con la sesión actual y devuelve su id y código. */
export async function createRequest(page, { descripcion, evidencia = false } = {}) {
  await page.goto('/solicitudes/nueva');
  await page.getByLabel('Categoría').selectOption({ label: TI_CATEGORY });
  await page.getByLabel('Ubicación').fill('Pabellón B, aula 204');
  await page.getByLabel('Descripción').fill(descripcion || `Prueba E2E ${unique()}: el proyector no enciende.`);
  if (evidencia) await page.getByLabel('Evidencias (opcional)').setInputFiles(PNG);
  await page.getByRole('button', { name: 'Registrar solicitud' }).click();
  await page.waitForURL(/\/solicitudes\/\d+$/);
  const status = page.getByRole('status').filter({ hasText: /registrada/ });
  await expect(status).toBeVisible();
  const codigo = (await status.textContent()).match(/SOL-\d{4}-\d+/)?.[0] ?? null;
  const id = new URL(page.url()).pathname.split('/').pop();
  return { id, codigo };
}

/** Cierra la sesión actual y entra con otro rol. */
export async function switchTo(page, rol) {
  await logout(page);
  await login(page, rol);
}

/** Laboratorio 204 (área de TI) existe en ambos modos. */
export const LAB = 'Laboratorio 204';

/** Día laborable entre 5 y 27 días adelante (dentro de la anticipación máxima de 30 días). */
export function futureWeekday() {
  for (;;) {
    const offset = 5 + Math.floor(Math.random() * 23);
    const date = new Date(Date.now() - 5 * 3600_000 + offset * 86_400_000);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) return date.toISOString().slice(0, 10);
  }
}

const toMinutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const toHour = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * Elige el Laboratorio 204 en `fecha` y devuelve su id y la primera hora libre
 * de 60 minutos según la lista de franjas que muestra la pantalla.
 */
export async function chooseLabSlot(page, fecha) {
  await page.goto('/reservas/nueva');
  await page.getByLabel('Fecha').fill(fecha);
  const availability = page.waitForRequest((r) => /\/api\/v1\/spaces\/\d+\/availability/.test(r.url()));
  await page.getByRole('button', { name: `Elegir ${LAB}` }).click();
  const espacioId = (await availability).url().match(/spaces\/(\d+)\//)[1];
  const slots = page.getByRole('list', { name: /^Franjas del/ });
  await expect(slots).toBeVisible();
  for (const text of await slots.getByRole('listitem').allTextContents()) {
    const match = text.match(/^(\d\d:\d\d)–(\d\d:\d\d) libre$/);
    if (match && toMinutes(match[2]) - toMinutes(match[1]) >= 60) {
      const start = toMinutes(match[1]);
      return { espacioId, fecha, horaInicio: toHour(start), horaFin: toHour(start + 60) };
    }
  }
  throw new Error(`Sin franja libre de una hora en ${LAB} el ${fecha}`);
}

export async function fillSlot(page, slot, motivo = 'Práctica E2E') {
  await page.getByLabel('Hora de inicio').fill(slot.horaInicio);
  await page.getByLabel('Hora de fin').fill(slot.horaFin);
  await page.getByLabel('Motivo').fill(motivo);
}

/** Registra una reserva del Laboratorio 204 y devuelve su código. */
export async function createReservation(page, fecha = futureWeekday()) {
  const slot = await chooseLabSlot(page, fecha);
  await fillSlot(page, slot);
  await page.getByRole('button', { name: 'Registrar reserva' }).click();
  const status = page.getByRole('status').filter({ hasText: 'Reserva registrada' });
  await expect(status).toBeVisible();
  return { ...slot, codigo: (await status.textContent()).match(/RES-\d{4}-\d+/)[0] };
}

/**
 * Otra persona (Pedro) ocupa la franja entre la consulta y el envío: en modo
 * real con la API; en el simulado, directamente en la base simulada de la página.
 */
export async function occupySlot(page, request, slot) {
  if (IS_REAL) {
    const token = await apiToken(request, ACCOUNTS.DOCENTE);
    const response = await request.post('/api/v1/reservations', {
      headers: { Authorization: `Bearer ${token}` },
      data: { ...slot, motivo: 'Ocupada por otra persona (E2E)' },
    });
    expect(response.status()).toBe(201);
    return;
  }
  await page.evaluate((s) => {
    const db = window.__mockDb;
    const base = db.reservations.find((r) => r.solicitanteId === '9');
    db.reservations.push({ ...base, ...s, id: '900', codigo: 'RES-2026-000900', estado: 'PENDIENTE', history: [] });
  }, slot);
}

/** Fila de la tabla que contiene `text`, avanzando de página si hace falta. */
export async function rowWith(page, text) {
  for (let i = 0; i < 20; i += 1) {
    await page.getByRole('table').first().waitFor();
    const row = page.getByRole('row').filter({ hasText: text });
    if (await row.count()) return row.first();
    const next = page.getByRole('button', { name: 'Siguiente' });
    if (!(await next.isVisible()) || await next.isDisabled()) break;
    await next.click();
    await page.waitForTimeout(300);
  }
  throw new Error(`No se encontró la fila con «${text}»`);
}
