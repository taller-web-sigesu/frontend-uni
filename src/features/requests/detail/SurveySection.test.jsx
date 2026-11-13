import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../mocks/server.js';
import { db } from '../../../mocks/db.js';
import { renderWithRouter } from '../../../test/render.jsx';
import { ANA, captureRequests, SUPERVISORA_TI, TECNICO_TI, userById } from '../../../test/users.js';
import { SurveySection } from './SurveySection.jsx';

afterEach(() => server.events.removeAllListeners());

function renderSurvey() {
  const user = userEvent.setup();
  renderWithRouter(<SurveySection requestId="5" />, { session: { user: userById(ANA) } });
  return user;
}

test('envía la calificación elegida', async () => {
  const calls = captureRequests('POST', '/api/v1/requests/5/survey');
  const user = renderSurvey();
  await user.click(screen.getByRole('radio', { name: '4' }));
  await user.click(screen.getByRole('button', { name: 'Enviar encuesta' }));
  expect(await screen.findByText('Gracias por tu respuesta')).toBeInTheDocument();
  expect(calls.map((c) => c.body)).toEqual([{ calificacion: 4 }]);
  expect(screen.queryByRole('button', { name: 'Enviar encuesta' })).not.toBeInTheDocument();
});

test('sin calificación no envía', async () => {
  const calls = captureRequests('POST', '/api/v1/requests/5/survey');
  const user = renderSurvey();
  await user.type(screen.getByLabelText('Comentario (opcional)'), 'Bien');
  await user.click(screen.getByRole('button', { name: 'Enviar encuesta' }));
  expect(screen.getByText('Elige una calificación.')).toBeInTheDocument();
  expect(calls).toHaveLength(0);
});

test('409 marca la encuesta como respondida', async () => {
  db.requests.find((r) => r.id === '5').survey = { id: '1', calificacion: 5, comentario: null };
  const user = renderSurvey();
  await user.click(screen.getByRole('radio', { name: '5' }));
  await user.click(screen.getByRole('button', { name: 'Enviar encuesta' }));
  expect(await screen.findByText('Ya respondiste esta encuesta')).toBeInTheDocument();
  expect(screen.queryByRole('radio', { name: '5' })).not.toBeInTheDocument();
});

test('no aparece en solicitudes no cerradas ni para el técnico', async () => {
  const cases = [
    { id: '3', userId: ANA },
    { id: '5', userId: SUPERVISORA_TI },
    { id: '3', userId: TECNICO_TI },
  ];
  for (const { id, userId } of cases) {
    const { unmount } = renderWithRouter(null, { route: `/solicitudes/${id}`, session: { user: userById(userId) } });
    await screen.findByRole('heading', { name: `SOL-2026-00000${id}` });
    expect(screen.queryByRole('heading', { name: 'Encuesta de satisfacción' })).not.toBeInTheDocument();
    unmount();
  }
  renderWithRouter(null, { route: '/solicitudes/5', session: { user: userById(ANA) } });
  expect(await screen.findByRole('heading', { name: 'Encuesta de satisfacción' })).toBeInTheDocument();
});
