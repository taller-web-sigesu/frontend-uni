import { render, screen, within } from '@testing-library/react';
import { HistoryTimeline } from './HistoryTimeline.jsx';

const ASIGNACION = {
  estadoAnterior: 'NUEVO',
  estado: 'ASIGNADO',
  actorId: '4',
  actorNombre: 'Sofía Supervisora TI',
  fecha: '2026-11-14T05:08:31Z',
  motivo: null,
};

test('muestra el actor que envía la API aunque no sea el usuario actual', () => {
  render(<HistoryTimeline items={[ASIGNACION]} personName={() => null} />);
  const item = within(screen.getByRole('list')).getAllByRole('listitem')[0];
  expect(item).toHaveTextContent('14/11/2026 00:08 · Sofía Supervisora TI');
});

test('usa el índice local solo si la API no envía el nombre', () => {
  render(<HistoryTimeline items={[{ ...ASIGNACION, actorNombre: null }]} personName={() => 'Sofía local'} />);
  const item = within(screen.getByRole('list')).getAllByRole('listitem')[0];
  expect(item).toHaveTextContent('Sofía local');
});
