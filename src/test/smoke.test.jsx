import { render, screen } from '@testing-library/react';

test('renderiza en jsdom con jest-dom', () => {
  render(<h1>Hola</h1>);
  expect(screen.getByRole('heading', { name: 'Hola' })).toBeInTheDocument();
});
