import { statusHandlers } from './status.js';
import { catalogHandlers } from './catalogs.js';

// Cada fase registra aquí el arreglo de handlers de su feature.
export const handlers = [
  ...statusHandlers,
  ...catalogHandlers,
];
