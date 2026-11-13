import { useCallback, useEffect, useRef, useState } from 'react';
import { isAbort } from './http.js';

/**
 * Lectura con estado de carga. Solo la última petición puede escribir el
 * resultado: las anteriores se abortan y, si igual resuelven, se descartan.
 */
export function useResource(loader, deps) {
  const loaderRef = useRef(loader);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ data: undefined, error: null, status: 'loading' });

  // Declarado antes que el efecto de carga para que este ya vea el loader nuevo.
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    Promise.resolve()
      .then(() => {
        if (current) setState((previous) => ({ ...previous, error: null, status: 'loading' }));
        return loaderRef.current(controller.signal);
      })
      .then(
        (data) => {
          if (current) setState({ data, error: null, status: 'success' });
        },
        (error) => {
          if (!current || isAbort(error)) return;
          setState((previous) => ({ data: previous.data, error, status: 'error' }));
        },
      );
    return () => {
      current = false;
      controller.abort();
    };
    // Las dependencias las decide quien llama, como en useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const setData = useCallback((updater) => {
    setState((previous) => ({
      ...previous,
      data: typeof updater === 'function' ? updater(previous.data) : updater,
    }));
  }, []);

  return { ...state, reload, setData };
}
