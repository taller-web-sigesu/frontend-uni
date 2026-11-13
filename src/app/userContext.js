import { createContext, useContext } from 'react';

// Usuario autenticado actual. En la fase 02 lo provee la sesión; hasta entonces,
// main.jsx lo fija solo en modo simulado para revisar las pantallas.
export const UserContext = createContext(null);

export function useCurrentUser() {
  return useContext(UserContext);
}
