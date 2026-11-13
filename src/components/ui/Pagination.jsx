import { Button } from './Button.jsx';

export function Pagination({ page, size, totalElements, onChange }) {
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  return (
    <nav className="pagination" aria-label="Paginación">
      <Button variant="secondary" disabled={page <= 0} onClick={() => onChange(page - 1)}>Anterior</Button>
      <span className="pagination__status">Página {page + 1} de {totalPages}</span>
      <Button variant="secondary" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Siguiente</Button>
    </nav>
  );
}
