import { render, screen } from '@testing-library/react';
import { SlaBadge } from './RequestSummary.jsx';

test('el SLA cerrado se muestra en masculino', () => {
  render(<SlaBadge sla={{ estado: 'CERRADA' }} />);
  expect(screen.getByText('SLA: Cerrado')).toBeInTheDocument();
});
