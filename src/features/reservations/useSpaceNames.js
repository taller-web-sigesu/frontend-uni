import { useCallback, useMemo } from 'react';
import { useResource } from '../../services/useResource.js';
import { listSpaces } from './reservationsApi.js';

/**
 * Nombres de espacio desde `GET /spaces` (activos). Las reservas traen
 * `espacio`; esto cubre su ausencia. Desconocido → «Espacio <id>».
 */
export function useSpaceNames() {
  const { data } = useResource((signal) => listSpaces({ page: 0, size: 100 }, signal), []);
  const items = data?.items;
  const spaceTypes = useMemo(() => {
    const unique = new Map();
    (items || []).forEach((s) => {
      if (s.tipo && !unique.has(s.tipo.id)) unique.set(s.tipo.id, { id: s.tipo.id, nombre: s.tipo.nombre });
    });
    return [...unique.values()];
  }, [items]);
  const spaceName = useCallback(
    (id) => items?.find((s) => s.id === id)?.nombre ?? `Espacio ${id}`,
    [items],
  );
  return { spaceName, spaceTypes, spaces: items || [] };
}
