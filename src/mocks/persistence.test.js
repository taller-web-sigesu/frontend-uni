import { db, issueSession, resetDb } from './db.js';
import { restoreMockState, saveMockState, MOCK_STATE_KEY } from './persistence.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    raw: () => data.get(MOCK_STATE_KEY),
  };
}

test('la API simulada conserva su estado entre recargas sin guardar el JWT', () => {
  const storage = memoryStorage();
  const session = issueSession(db.users.find((u) => u.id === '8'));
  db.requests[0].descripcion = 'Cambiada antes de recargar';
  saveMockState(storage);
  expect(storage.raw()).not.toContain(session.accessToken);

  resetDb();
  expect(db.refreshCookie).toBeNull();
  restoreMockState(storage);
  expect(db.refreshCookie).toBe(session.refreshToken);
  expect(db.requests[0].descripcion).toBe('Cambiada antes de recargar');
  // Tras recargar, el JWT anterior ya no autentica: solo vale el refresh.
  expect(db.sessions.find((s) => s.id === session.id).accessToken).toBeNull();
});

test('las evidencias guardadas no conservan los bytes', () => {
  const storage = memoryStorage();
  db.requests[0].attachments.push({ id: '1', nombre: 'a.png', bytes: new Uint8Array([1, 2, 3]), tamanoBytes: 3 });
  saveMockState(storage);
  resetDb();
  restoreMockState(storage);
  expect(db.requests[0].attachments[0]).not.toHaveProperty('bytes');
  expect(db.requests[0].attachments[0].nombre).toBe('a.png');
});

test('sin estado guardado o con JSON roto deja los datos iniciales', () => {
  const storage = memoryStorage();
  restoreMockState(storage);
  expect(db.refreshCookie).toBeNull();
  storage.setItem(MOCK_STATE_KEY, '{roto');
  expect(() => restoreMockState(storage)).not.toThrow();
  expect(db.users).toHaveLength(14);
});
