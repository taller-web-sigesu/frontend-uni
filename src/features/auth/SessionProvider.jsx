import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState,
} from 'react';
import { configureHttp } from '../../services/http.js';
import { UserContext } from '../../app/userContext.js';
import * as authApi from './authApi.js';
import { createRefreshCoordinator } from './refreshCoordinator.js';

const SessionContext = createContext(null);

function initialState(initialSession) {
  if (initialSession?.user) {
    return {
      status: 'authenticated',
      user: initialSession.user,
      mustChangePassword: Boolean(initialSession.mustChangePassword),
      epoch: 0,
      logoutPending: false,
    };
  }
  return { status: 'restoring', user: null, mustChangePassword: false, epoch: 0, logoutPending: false };
}

function reducer(state, action) {
  switch (action.type) {
    case 'authenticated':
      return {
        ...state, status: 'authenticated', user: action.user, mustChangePassword: action.mustChangePassword, loggedOut: false,
      };
    case 'anonymous':
      return { ...state, status: 'anonymous', user: null, mustChangePassword: false };
    case 'loggedOut':
      // `loggedOut`: salida voluntaria; el siguiente ingreso no vuelve a la página anterior.
      return { ...state, status: 'anonymous', user: null, mustChangePassword: false, epoch: action.epoch, loggedOut: true };
    case 'mustChangePassword':
      return state.status === 'authenticated' ? { ...state, mustChangePassword: true } : state;
    case 'logoutPending':
      return { ...state, logoutPending: action.value };
    default:
      return state;
  }
}

/**
 * Sesión en memoria: el JWT vive en una ref (nunca en storage) y el refresh en
 * la cookie HttpOnly. `epoch` crece en cada logout; una respuesta de login,
 * renovación o cambio de contraseña iniciada en una época anterior se descarta.
 */
export function SessionProvider({ children, api = authApi, locks, initialSession = null }) {
  const [state, dispatch] = useReducer(reducer, initialSession, initialState);
  const tokenRef = useRef(initialSession?.token ?? null);
  const epochRef = useRef(0);
  const pendingLogoutTokenRef = useRef(null);
  const apiRef = useRef(api);
  useLayoutEffect(() => {
    apiRef.current = api;
  });
  // `api` y `locks` se fijan al montar (en la app no cambian; en pruebas se inyectan).
  const [coordinator] = useState(() => createRefreshCoordinator({ doRefresh: () => api.refresh(), locks }));

  const apply = useCallback((response) => {
    tokenRef.current = response.tokenAcceso;
    dispatch({
      type: 'authenticated',
      user: response.usuario,
      mustChangePassword: Boolean(response.debeCambiarContrasena),
    });
    return response;
  }, []);

  /** true si hay un token válido para reintentar la petición que recibió 401. */
  const renewSession = useCallback(async (failedToken) => {
    // La petición salió con un token que ya no es el actual: otra petición ya
    // renovó (reintentar) o se cerró la sesión (no renovar: no la restaura).
    if (failedToken && failedToken !== tokenRef.current) return Boolean(tokenRef.current);
    const epoch = epochRef.current;
    let response;
    try {
      response = await coordinator.renew();
    } catch {
      return false;
    }
    if (epochRef.current !== epoch) return false;
    if (!response) {
      tokenRef.current = null;
      dispatch({ type: 'anonymous' });
      return false;
    }
    apply(response);
    return true;
  }, [apply, coordinator]);

  // En layout para que esté listo antes de los efectos que piden datos.
  useLayoutEffect(() => {
    configureHttp({
      getAccessToken: () => tokenRef.current,
      renewSession,
      onProblem: (error) => {
        if (error?.codigo === 'CAMBIO_CONTRASENA_REQUERIDO') dispatch({ type: 'mustChangePassword' });
      },
    });
    return () => configureHttp({});
  }, [renewSession]);

  const restoredRef = useRef(Boolean(initialSession?.user));
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const epoch = epochRef.current;
    renewSession(null).then((ok) => {
      if (!ok && epochRef.current === epoch) dispatch({ type: 'anonymous' });
    });
  }, [renewSession]);

  const login = useCallback(async (credentials) => {
    const epoch = epochRef.current;
    const response = await apiRef.current.login(credentials);
    if (epochRef.current !== epoch) return null;
    return apply(response);
  }, [apply]);

  const changePassword = useCallback(async (data) => {
    const epoch = epochRef.current;
    const response = await apiRef.current.changePassword(data);
    if (epochRef.current !== epoch) return null;
    return apply(response);
  }, [apply]);

  const sendLogout = useCallback(async (token) => {
    try {
      await apiRef.current.logout(token);
    } catch (error) {
      // 401: la sesión ya no existe en el servidor, que es lo que se buscaba.
      if (error?.kind === 'network') {
        pendingLogoutTokenRef.current = token;
        dispatch({ type: 'logoutPending', value: true });
        return;
      }
    }
    pendingLogoutTokenRef.current = null;
    dispatch({ type: 'logoutPending', value: false });
  }, []);

  const logout = useCallback(() => {
    const token = tokenRef.current;
    epochRef.current += 1;
    tokenRef.current = null;
    dispatch({ type: 'loggedOut', epoch: epochRef.current });
    return sendLogout(token);
  }, [sendLogout]);

  const retryLogout = useCallback(
    () => sendLogout(pendingLogoutTokenRef.current),
    [sendLogout],
  );

  const value = useMemo(() => ({
    ...state,
    login,
    logout,
    changePassword,
    retryLogout,
  }), [state, login, logout, changePassword, retryLogout]);

  return (
    <SessionContext.Provider value={value}>
      <UserContext.Provider value={state.user}>{children}</UserContext.Provider>
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession debe usarse dentro de SessionProvider');
  return session;
}
