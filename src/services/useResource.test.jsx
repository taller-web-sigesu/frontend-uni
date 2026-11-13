import { act, renderHook, waitFor } from '@testing-library/react';
import { useResource } from './useResource.js';
import { ApiError } from './apiError.js';

function delayed(value, ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(value), ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });
}

test('useResource descarta la respuesta de una petición anterior', async () => {
  const seen = [];
  // El loader ignora el AbortSignal a propósito: la protección no debe depender de que el servidor respete el aborto.
  const loader = (filtro) => () => delayed(filtro, filtro === 'A' ? 50 : 10);
  const { result, rerender } = renderHook(({ filtro }) => {
    const resource = useResource(loader(filtro), [filtro]);
    if (resource.data) seen.push(resource.data);
    return resource;
  }, { initialProps: { filtro: 'A' } });

  rerender({ filtro: 'B' });
  await waitFor(() => expect(result.current.data).toBe('B'));
  await new Promise((resolve) => setTimeout(resolve, 70));
  expect(result.current.data).toBe('B');
  expect(seen).not.toContain('A');
});

test('useResource aborta la petición anterior al cambiar las dependencias', async () => {
  const signals = [];
  const { rerender, result } = renderHook(({ filtro }) => useResource((signal) => {
    signals.push(signal);
    return delayed(filtro, 10, signal);
  }, [filtro]), { initialProps: { filtro: 'A' } });
  rerender({ filtro: 'B' });
  await waitFor(() => expect(result.current.status).toBe('success'));
  expect(signals[0].aborted).toBe(true);
});

test('useResource expone error y recupera con reload', async () => {
  let fail = true;
  const error = new ApiError({ kind: 'http', status: 500 });
  const { result } = renderHook(() => useResource(async () => {
    if (fail) throw error;
    return 'ok';
  }, []));
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.error).toBe(error);
  fail = false;
  act(() => result.current.reload());
  await waitFor(() => expect(result.current.status).toBe('success'));
  expect(result.current.data).toBe('ok');
  expect(result.current.error).toBeNull();
});
