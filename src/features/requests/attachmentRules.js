// Validación local de evidencias. Es solo una ayuda: el servidor valida por
// contenido y sus mensajes son los mismos que estos.

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;
export const ATTACHMENT_ACCEPT = '.jpg,.jpeg,.png,.pdf';

export const ATTACHMENT_MESSAGES = {
  type: 'Solo se aceptan archivos JPG, PNG o PDF.',
  size: 'El tamaño máximo es 5 MB.',
  empty: 'El archivo está vacío.',
  limit: 'Ya hay 5 evidencias. Elimina una para adjuntar otra.',
};

const MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const EXTENSION = /\.(jpe?g|png|pdf)$/i;

function reasonFor(file) {
  if (!MIME_TYPES.includes(file.type) && !EXTENSION.test(file.name)) return ATTACHMENT_MESSAGES.type;
  if (file.size === 0) return ATTACHMENT_MESSAGES.empty;
  if (file.size > MAX_ATTACHMENT_BYTES) return ATTACHMENT_MESSAGES.size;
  return null;
}

/** Separa los archivos que se pueden subir de los rechazados, con su motivo. */
export function validateFiles(files, vigentes = 0) {
  let room = Math.max(0, MAX_ATTACHMENTS - vigentes);
  const valid = [];
  const rejected = [];
  files.forEach((file) => {
    const reason = reasonFor(file);
    if (reason) rejected.push({ file, reason });
    else if (room === 0) rejected.push({ file, reason: ATTACHMENT_MESSAGES.limit });
    else {
      valid.push(file);
      room -= 1;
    }
  });
  return { valid, rejected };
}
