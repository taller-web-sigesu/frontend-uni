import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage.jsx';

vi.mock('./RequestsPreview.jsx', () => ({ RequestsPreview: () => <p>sección solicitudes</p> }));
vi.mock('./AdminShortcuts.jsx', () => ({ AdminShortcuts: () => <p>sección administración</p> }));
vi.mock('./ReservationsPreview.jsx', () => ({ ReservationsPreview: () => <p>sección reservas</p> }));

function sections() {
  return ['sección solicitudes', 'sección administración', 'sección reservas']
    .filter((text) => screen.queryByText(text));
}

test('HomePage elige las secciones por rol', () => {
  const { rerender } = render(<HomePage user={{ id: '1', nombreCompleto: 'Admin Demo', rol: 'ADMINISTRADOR' }} />);
  expect(sections()).toEqual(['sección administración']);

  rerender(<HomePage user={{ id: '5', nombreCompleto: 'Técnico TI Demo', rol: 'TECNICO' }} />);
  expect(sections()).toEqual(['sección solicitudes', 'sección reservas']);

  rerender(<HomePage user={{ id: '9', nombreCompleto: 'Pedro Demo', rol: 'DOCENTE' }} />);
  expect(sections()).toEqual(['sección solicitudes', 'sección reservas']);
});

test('HomePage saluda por el nombre', () => {
  render(<HomePage user={{ id: '8', nombreCompleto: 'Ana Demo', rol: 'ESTUDIANTE' }} />);
  expect(screen.getByRole('heading', { name: 'Hola, Ana Demo' })).toBeInTheDocument();
});
