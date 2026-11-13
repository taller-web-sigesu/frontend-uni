/**
 * El contrato solo da `actorId` en historial y auditoría. Los nombres se toman
 * de las personas que ya trae el detalle (solicitante, responsables, autores).
 */
export function peopleIndex(solicitud, comments = [], currentUser = null) {
  const index = new Map();
  [currentUser, solicitud?.solicitante, solicitud?.responsableActual, solicitud?.ultimoResponsable, ...comments.map((c) => c.autor)]
    .filter(Boolean)
    .forEach((person) => index.set(person.id, person.nombreCompleto));
  return (id) => index.get(id) || null;
}
