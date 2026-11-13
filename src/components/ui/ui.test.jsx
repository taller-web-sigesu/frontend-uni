import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, TextField, Dialog, ErrorState, DataTable, Pagination } from './index.js';

test('TextField enlaza etiqueta y error', () => {
  render(<TextField label="Correo" name="correo" error="Obligatorio" />);
  const input = screen.getByLabelText('Correo');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Obligatorio');
});

test('Button pending queda deshabilitado y ocupado', () => {
  render(<Button pending>Guardar</Button>);
  const button = screen.getByRole('button', { name: 'Guardar' });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-busy', 'true');
});

function DialogHarness({ onClose }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Abrir</button>
      <Dialog open={open} title="Detalle" onClose={() => { onClose(); setOpen(false); }}>
        <button type="button">Dentro</button>
      </Dialog>
    </>
  );
}

test('Dialog devuelve el foco al cerrar con Escape', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<DialogHarness onClose={onClose} />);
  const abrir = screen.getByRole('button', { name: 'Abrir' });
  await user.click(abrir);
  expect(screen.getByRole('dialog', { name: 'Detalle' })).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(abrir).toHaveFocus();
});

test('ErrorState muestra detail, código de rastreo y reintento', async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  render(<ErrorState error={{ detail: 'Falló la carga', correlationId: 'abc' }} onRetry={onRetry} />);
  expect(screen.getByText('Falló la carga')).toBeInTheDocument();
  expect(screen.getByText('Código de rastreo: abc')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('ErrorState sin onRetry no muestra el botón', () => {
  render(<ErrorState error={{}} />);
  expect(screen.getByText('No se pudo completar la operación.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
});

test('DataTable añade data-label con el encabezado a cada celda', () => {
  render(
    <DataTable
      caption="Solicitudes"
      columns={[{ key: 'codigo', header: 'Código' }, { key: 'estado', header: 'Estado', render: (r) => r.estado.toLowerCase() }]}
      rows={[{ id: '1', codigo: 'SOL-1', estado: 'NUEVO' }]}
      getRowKey={(r) => r.id}
    />,
  );
  const table = screen.getByRole('table', { name: 'Solicitudes' });
  const cells = within(table).getAllByRole('cell');
  expect(cells[0]).toHaveAttribute('data-label', 'Código');
  expect(cells[0]).toHaveTextContent('SOL-1');
  expect(cells[1]).toHaveAttribute('data-label', 'Estado');
  expect(cells[1]).toHaveTextContent('nuevo');
});

test('Pagination calcula páginas y deshabilita extremos', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Pagination page={0} size={20} totalElements={41} onChange={onChange} />);
  expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(onChange).toHaveBeenCalledWith(1);
});

test('DataTable con onRowClick abre la fila con el teclado', async () => {
  const user = userEvent.setup();
  const onRowClick = vi.fn();
  render(
    <DataTable
      caption="Solicitudes"
      columns={[{ key: 'codigo', header: 'Código' }]}
      rows={[{ id: '1', codigo: 'SOL-1' }]}
      getRowKey={(r) => r.id}
      onRowClick={onRowClick}
    />,
  );
  const row = screen.getByRole('row', { name: /SOL-1/ });
  row.focus();
  expect(row).toHaveFocus();
  await user.keyboard('{Enter}');
  await user.keyboard(' ');
  expect(onRowClick).toHaveBeenCalledTimes(2);
  expect(onRowClick).toHaveBeenCalledWith({ id: '1', codigo: 'SOL-1' });
});
