/** Primera pantalla tras ingresar: el supervisor no tiene /inicio. */
export function homePathFor(rol) {
  return rol === 'SUPERVISOR' ? '/indicadores' : '/inicio';
}
