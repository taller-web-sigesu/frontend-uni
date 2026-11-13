export const CONFLICT_MESSAGE = 'La solicitud cambió mientras la revisabas. Se cargó su estado actual.';

export const isConflict = (error) => error?.status === 409;
