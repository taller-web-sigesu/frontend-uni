export const REFRESH_LOCK = 'gestal-auth-refresh';

/**
 * Reutilizar una cookie de renovación ya rotada revoca la sesión. Por eso:
 * - en la pestaña, las llamadas simultáneas comparten una sola promesa;
 * - entre pestañas, `doRefresh` corre dentro de un Web Lock exclusivo, y la
 *   segunda pestaña llega con la cookie que la primera ya rotó.
 * Sin Web Locks queda solo la deduplicación por pestaña.
 *
 * `renew()` resuelve la respuesta de sesión, `null` si el servidor responde
 * 401 (sesión perdida) y rechaza ante cualquier otro error.
 */
export function createRefreshCoordinator({ doRefresh, locks = globalThis.navigator?.locks }) {
  let inFlight = null;

  async function run() {
    try {
      if (locks?.request) {
        return await locks.request(REFRESH_LOCK, { mode: 'exclusive' }, () => doRefresh());
      }
      return await doRefresh();
    } catch (error) {
      if (error?.status === 401) return null;
      throw error;
    }
  }

  function renew() {
    if (!inFlight) {
      inFlight = run().finally(() => { inFlight = null; });
    }
    return inFlight;
  }

  return { renew };
}
