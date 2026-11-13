import { statusHandlers } from './status.js';
import { catalogHandlers } from './catalogs.js';
import { authHandlers } from './auth.js';
import { requestHandlers } from './requests.js';

// Cada fase registra aquí el arreglo de handlers de su feature.
export const handlers = [
  ...statusHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...requestHandlers,
];
