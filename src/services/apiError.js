export const GENERIC_ERROR = 'No se pudo completar la operación.';
export const NETWORK_ERROR = 'No hay conexión con el servidor.';

export class ApiError extends Error {
  constructor({ kind, status = null, codigo = null, detail = GENERIC_ERROR, fieldErrors = {}, correlationId = null }) {
    super(detail);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.codigo = codigo;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
    this.correlationId = correlationId;
  }
}

function toFieldErrors(errores) {
  if (!Array.isArray(errores)) return {};
  return errores.reduce((acc, { campo, mensaje }) => {
    if (campo && !acc[campo]) acc[campo] = mensaje;
    return acc;
  }, {});
}

/** Convierte una respuesta no exitosa en ApiError sin fallar si el cuerpo no es JSON. */
export async function parseProblem(response) {
  const headerCorrelation = response.headers.get('X-Correlation-ID');
  const contentType = response.headers.get('Content-Type') || '';
  let body = null;
  if (contentType.includes('json')) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  }
  return new ApiError({
    kind: 'http',
    status: response.status,
    codigo: body?.codigo ?? null,
    detail: body?.detail || GENERIC_ERROR,
    fieldErrors: toFieldErrors(body?.errores),
    correlationId: body?.correlationId ?? headerCorrelation ?? null,
  });
}
