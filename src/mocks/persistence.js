import { db } from './state.js';

/** Solo la API simulada del navegador: sin esto, recargar la página borra la sesión simulada. */
export const MOCK_STATE_KEY = 'mock-api-state';

/**
 * Guarda el estado simulado (el equivalente a la base de datos y la cookie).
 * Nunca guarda el JWT: tras recargar, la sesión se restaura solo con el refresh.
 */
export function saveMockState(storage) {
  const json = JSON.stringify(db, (key, value) => {
    if (key === 'accessToken') return null;
    if (key === 'bytes') return undefined;
    return value;
  });
  try {
    storage.setItem(MOCK_STATE_KEY, json);
  } catch {
    // Sin almacenamiento disponible la simulación sigue, solo que sin recargas.
  }
}

export function restoreMockState(storage) {
  let saved = null;
  try {
    saved = JSON.parse(storage.getItem(MOCK_STATE_KEY) || 'null');
  } catch {
    saved = null;
  }
  if (saved && typeof saved === 'object') Object.assign(db, saved);
}
