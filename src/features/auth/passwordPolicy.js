export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const INSTITUTIONAL_DOMAIN = '@unmsm.edu.pe';

/** Mensaje de la primera regla incumplida, o `null` si la contraseña es válida. */
export function validatePassword(value) {
  const password = value || '';
  if (password.length < PASSWORD_MIN) return `Usa al menos ${PASSWORD_MIN} caracteres.`;
  if (password.length > PASSWORD_MAX) return `Usa como máximo ${PASSWORD_MAX} caracteres.`;
  if (!/\p{L}/u.test(password)) return 'Incluye al menos una letra.';
  if (!/\d/.test(password)) return 'Incluye al menos un dígito.';
  return null;
}

/** Termina exactamente en @unmsm.edu.pe (sin subdominios), sin distinguir mayúsculas. */
export function isInstitutionalEmail(value) {
  const email = (value || '').trim().toLowerCase();
  const at = email.indexOf('@');
  return at > 0 && email.slice(at) === INSTITUTIONAL_DOMAIN && email.indexOf('@', at + 1) === -1;
}
