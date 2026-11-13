import { ApiError } from '../../services/apiError.js';
import { createRefreshCoordinator, REFRESH_LOCK } from './refreshCoordinator.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

/** Web Locks falso: ejecuta en orden, uno a la vez, y registra los nombres. */
function fakeLocks() {
  const names = [];
  let tail = Promise.resolve();
  return {
    names,
    request(name, options, callback) {
      names.push({ name, mode: options.mode });
      const run = tail.then(() => callback({ name }));
      tail = run.catch(() => {});
      return run;
    },
  };
}

const RESPONSE = { tokenAcceso: 't1', usuario: { id: '8' } };

test('comparte una sola renovación entre llamadas simultáneas', async () => {
  const pending = deferred();
  const doRefresh = vi.fn(() => pending.promise);
  const { renew } = createRefreshCoordinator({ doRefresh, locks: null });
  const calls = [renew(), renew(), renew()];
  pending.resolve(RESPONSE);
  const results = await Promise.all(calls);
  expect(doRefresh).toHaveBeenCalledTimes(1);
  results.forEach((result) => expect(result).toBe(RESPONSE));
});

test('tras terminar, una nueva llamada vuelve a renovar', async () => {
  const doRefresh = vi.fn(async () => RESPONSE);
  const { renew } = createRefreshCoordinator({ doRefresh, locks: null });
  await renew();
  await renew();
  expect(doRefresh).toHaveBeenCalledTimes(2);
});

test('serializa con Web Locks', async () => {
  const locks = fakeLocks();
  let running = 0;
  let maxRunning = 0;
  const doRefresh = vi.fn(async () => {
    running += 1;
    maxRunning = Math.max(maxRunning, running);
    await new Promise((r) => setTimeout(r, 5));
    running -= 1;
    return RESPONSE;
  });
  const tabA = createRefreshCoordinator({ doRefresh, locks });
  const tabB = createRefreshCoordinator({ doRefresh, locks });
  await Promise.all([tabA.renew(), tabB.renew()]);
  expect(doRefresh).toHaveBeenCalledTimes(2);
  expect(maxRunning).toBe(1);
  expect(locks.names).toEqual([
    { name: REFRESH_LOCK, mode: 'exclusive' },
    { name: REFRESH_LOCK, mode: 'exclusive' },
  ]);
  expect(REFRESH_LOCK).toBe('gestal-auth-refresh');
});

test('funciona sin navigator.locks', async () => {
  const doRefresh = vi.fn(async () => RESPONSE);
  const { renew } = createRefreshCoordinator({ doRefresh, locks: undefined });
  expect(await renew()).toBe(RESPONSE);
});

test('401 resuelve null', async () => {
  const doRefresh = vi.fn(async () => { throw new ApiError({ kind: 'http', status: 401 }); });
  const { renew } = createRefreshCoordinator({ doRefresh, locks: null });
  expect(await renew()).toBeNull();
});

test('error de red se propaga', async () => {
  const error = new ApiError({ kind: 'network', detail: 'No hay conexión con el servidor.' });
  const doRefresh = vi.fn(async () => { throw error; });
  const { renew } = createRefreshCoordinator({ doRefresh, locks: null });
  await expect(renew()).rejects.toBe(error);
});
