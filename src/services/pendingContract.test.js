import source from './pendingContract.js?raw';

test('pendingContract no importa la API simulada (no entra al bundle de producción)', () => {
  expect(source).not.toMatch(/from ['"][^'"]*mocks\//);
});
