export const CONFLICT_MESSAGE = 'La solicitud cambió mientras la revisabas. Se cargó su estado actual.';

export const isConflict = (error) => error?.status === 409;

/** 409 (otro actor cambió la solicitud) o 404 (se perdió el acceso): hay que recargar el detalle. */
export const needsReload = (error) => isConflict(error) || error?.status === 404;
