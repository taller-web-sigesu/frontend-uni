// Respaldos para datos simulados o respuestas antiguas que aún no traen el
// nombre de prioridad/área o la marca de encuesta respondida. Los catálogos
// reales se leen de `catalogs.js`; aquí no se inventan endpoints.
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

/** Respaldo para datos simulados o listados antiguos sin nombre de prioridad. */
export function priorityName(id) {
  if (isMockMode() && db) {
    const priority = db.priorities.find((p) => p.id === id);
    if (priority) return priority.nombre;
  }
  return `Prioridad ${id}`;
}

/** `true`/`false` si la solicitud trae la marca; `null` si la respuesta no la incluye. */
export function surveyAnswered(request) {
  return typeof request?.encuestaRespondida === 'boolean' ? request.encuestaRespondida : null;
}

/** Respaldo cuando la sesión o el detalle no traen el nombre del área. */
export function areaName(id) {
  if (isMockMode() && db) {
    const area = db.areas.find((a) => a.id === id);
    if (area) return area.nombre;
  }
  return `Área ${id}`;
}
