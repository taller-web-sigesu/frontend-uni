import { useCallback, useMemo } from 'react';
import { request } from './http.js';
import { useResource } from './useResource.js';

export async function listEnabledCategories(signal) {
  const page = await request('/catalogs/categories', { query: { page: 0, size: 100 }, signal });
  return page.items;
}

/** Prioridades activas para filtros, nombres y ajuste del supervisor (HU-07 y HU-08). */
export async function listActivePriorities(signal) {
  const page = await request('/admin/catalogs/priorities', { query: { page: 0, size: 100 }, signal });
  return page.items
    .filter((priority) => priority.activo)
    .sort((a, b) => a.nivel - b.nivel);
}

/** Nombres legibles para IDs de catálogo que llegan en solicitudes e indicadores. */
export function useCatalogLabels() {
  const { data, status } = useResource(async (signal) => {
    // Un catálogo auxiliar caído no debe impedir que la pantalla muestre el otro.
    const [categories, priorities] = await Promise.allSettled([
      listEnabledCategories(signal),
      listActivePriorities(signal),
    ]);
    return {
      categories: categories.status === 'fulfilled' ? categories.value : [],
      priorities: priorities.status === 'fulfilled' ? priorities.value : [],
    };
  }, []);
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const priorities = useMemo(() => data?.priorities ?? [], [data]);
  const categoryName = useCallback(
    (id) => categories.find((category) => category.id === id)?.nombre ?? `Categoría ${id}`,
    [categories],
  );
  const priorityName = useCallback(
    (id) => priorities.find((priority) => priority.id === id)?.nombre ?? `Prioridad ${id}`,
    [priorities],
  );
  const priorityLabel = useCallback(
    (value) => priorities.find((priority) => (
      priority.id === value || priority.codigo === value || priority.nombre === value
    ))?.nombre ?? value,
    [priorities],
  );

  return {
    categoryName,
    priorityName,
    priorityLabel,
    categories,
    priorities,
    ready: status !== 'loading',
  };
}
