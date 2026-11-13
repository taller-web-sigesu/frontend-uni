import { statusHandlers } from './status.js';
import { catalogHandlers } from './catalogs.js';
import { authHandlers } from './auth.js';
import { requestHandlers } from './requests.js';
import { dashboardHandlers } from './dashboard.js';
import { adminHandlers } from './admin.js';

// Cada fase registra aquí el arreglo de handlers de su feature.
export const handlers = [
  ...statusHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...requestHandlers,
  ...dashboardHandlers,
  ...adminHandlers,
];
