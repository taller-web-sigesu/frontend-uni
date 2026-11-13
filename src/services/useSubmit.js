import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Escritura disparada por un evento. Mientras hay un envío pendiente, otro
 * submit no hace nada. No toca los valores del formulario: si falla, quedan.
 */
export function useSubmit(action) {
  const actionRef = useRef(action);
  useEffect(() => {
    actionRef.current = action;
  });
  const pendingRef = useRef(false);
  const [state, setState] = useState({ pending: false, error: null });

  const submit = useCallback(async (...args) => {
    if (pendingRef.current) return undefined;
    pendingRef.current = true;
    setState({ pending: true, error: null });
    try {
      const result = await actionRef.current(...args);
      setState({ pending: false, error: null });
      return result;
    } catch (error) {
      setState({ pending: false, error });
      return undefined;
    } finally {
      pendingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => setState({ pending: false, error: null }), []);

  return {
    submit,
    pending: state.pending,
    error: state.error,
    fieldErrors: state.error?.fieldErrors || {},
    reset,
  };
}
