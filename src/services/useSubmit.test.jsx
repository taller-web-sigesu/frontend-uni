import { act, renderHook, waitFor } from '@testing-library/react';
import { useSubmit } from './useSubmit.js';
import { ApiError } from './apiError.js';

test('useSubmit ignora un segundo envío pendiente', async () => {
  let resolve;
  const action = vi.fn(() => new Promise((r) => { resolve = r; }));
  const { result } = renderHook(() => useSubmit(action));
  let first;
  let second;
  act(() => {
    first = result.current.submit('a');
    second = result.current.submit('b');
  });
  expect(action).toHaveBeenCalledTimes(1);
  expect(action).toHaveBeenCalledWith('a');
  expect(await second).toBeUndefined();
  await waitFor(() => expect(result.current.pending).toBe(true));
  await act(async () => { resolve('hecho'); await first; });
  expect(await first).toBe('hecho');
  expect(result.current.pending).toBe(false);
});

test('useSubmit expone fieldErrors del ApiError', async () => {
  const error = new ApiError({ kind: 'http', status: 400, fieldErrors: { correo: 'Obligatorio' } });
  const { result } = renderHook(() => useSubmit(async () => { throw error; }));
  let value;
  await act(async () => { value = await result.current.submit(); });
  expect(value).toBeUndefined();
  expect(result.current.error).toBe(error);
  expect(result.current.fieldErrors).toEqual({ correo: 'Obligatorio' });
  act(() => result.current.reset());
  expect(result.current.error).toBeNull();
  expect(result.current.fieldErrors).toEqual({});
});

test('useSubmit permite reenviar después de un fallo', async () => {
  const action = vi.fn()
    .mockRejectedValueOnce(new ApiError({ kind: 'network' }))
    .mockResolvedValueOnce('ok');
  const { result } = renderHook(() => useSubmit(action));
  await act(async () => { await result.current.submit(); });
  let value;
  await act(async () => { value = await result.current.submit(); });
  expect(value).toBe('ok');
  expect(action).toHaveBeenCalledTimes(2);
});
