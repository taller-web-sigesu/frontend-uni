import { isInstitutionalEmail, validatePassword } from './passwordPolicy.js';

test('validatePassword', () => {
  expect(validatePassword('abc12')).toMatch(/8/);
  expect(validatePassword('abcdefgh')).toMatch(/dígito/);
  expect(validatePassword('12345678')).toMatch(/letra/);
  expect(validatePassword('a1'.repeat(37))).toMatch(/72/);
  expect(validatePassword('clave2026')).toBeNull();
});

test('isInstitutionalEmail', () => {
  expect(isInstitutionalEmail(' Lucia@UNMSM.edu.pe ')).toBe(true);
  expect(isInstitutionalEmail('lucia@fisi.unmsm.edu.pe')).toBe(false);
  expect(isInstitutionalEmail('lucia@unmsm.edu.pe.com')).toBe(false);
});
