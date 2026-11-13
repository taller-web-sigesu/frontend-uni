import { createContext, useContext } from 'react';

// Usuario autenticado actual. Lo provee SessionProvider (null sin sesión).
export const UserContext = createContext(null);

export function useCurrentUser() {
  return useContext(UserContext);
}
