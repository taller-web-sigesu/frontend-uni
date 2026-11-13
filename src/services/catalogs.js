import { useCallback } from 'react';
import { request } from './http.js';
import { useResource } from './useResource.js';
import { priorityName } from './pendingContract.js';

export async function listEnabledCategories(signal) {
  const page = await request('/catalogs/categories', { query: { page: 0, size: 100 }, signal });
  return page.items;
}

/** Nombres legibles para IDs de catálogo que llegan en solicitudes e indicadores. */
export function useCatalogLabels() {
  const { data, status } = useResource((signal) => listEnabledCategories(signal), []);
  const categoryName = useCallback(
    (id) => data?.find((category) => category.id === id)?.nombre ?? `Categoría ${id}`,
    [data],
  );

  return { categoryName, priorityName, categories: data || [], ready: status !== 'loading' };
}
