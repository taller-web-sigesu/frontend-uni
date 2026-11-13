// Único lugar donde el frontend cubre lo que el contrato de la API todavía no
// expone (ver «Huecos del contrato conocidos» en el plan de la fase 01).
// En modo real no se inventan endpoints: se devuelve `null` o un texto de respaldo.
// Los datos simulados se registran desde fuera (main.jsx en modo simulado y la
// configuración de pruebas): importarlos aquí los metería en el bundle de producción.
let db = null;

/** Registra los datos de la API simulada; en modo real nunca se llama. */
export function registerMockData(data) {
  db = data;
}

export function isMockMode() {
  return import.meta.env.VITE_API_MODE === 'mock' || import.meta.env.MODE === 'test';
}

/** Opciones de prioridad para el supervisor. `null` = el contrato no las expone. */
export async function listPriorityOptions() {
  if (!isMockMode() || !db) return null;
  return db.priorities
    .filter((priority) => priority.activo)
    .sort((a, b) => a.nivel - b.nivel)
    .map(({ id, nombre }) => ({ id, nombre }));
}

export function priorityName(id) {
  if (isMockMode() && db) {
    const priority = db.priorities.find((p) => p.id === id);
    if (priority) return priority.nombre;
  }
  return `Prioridad ${id}`;
}

/** `true`/`false` si la solicitud trae la marca; `null` si el contrato no la incluye. */
export function surveyAnswered(request) {
  return typeof request?.encuestaRespondida === 'boolean' ? request.encuestaRespondida : null;
}

/**
 * Nombre del área. El catálogo de áreas solo lo expone /admin/catalogs/areas
 * (administrador): en modo real se muestra «Área <id>».
 */
export function areaName(id) {
  if (isMockMode() && db) {
    const area = db.areas.find((a) => a.id === id);
    if (area) return area.nombre;
  }
  return `Área ${id}`;
}
