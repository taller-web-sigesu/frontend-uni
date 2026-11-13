import { configureHttp } from '../services/http.js';
import { signInMock } from '../mocks/db.js';

/** Inicia una sesión simulada y hace que `request` envíe su Bearer. */
export function signInAs(correo = 'ana.demo@universidad.example') {
  const token = signInMock(correo);
  configureHttp({ getAccessToken: () => token });
  return token;
}
