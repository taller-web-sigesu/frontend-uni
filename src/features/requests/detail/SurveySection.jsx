import { useId, useState } from 'react';
import { Button, TextArea } from '../../../components/ui/index.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { submitSurvey } from '../requestsApi.js';

const SCORES = [1, 2, 3, 4, 5];

/**
 * Encuesta de satisfacción de una solicitud cerrada. El contrato no dice si ya
 * se respondió: el formulario se muestra y un 409 lo da por respondido.
 */
export function SurveySection({ requestId }) {
  const groupId = useId();
  const [score, setScore] = useState(null);
  const [comentario, setComentario] = useState('');
  const [localError, setLocalError] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const { submit, pending, error } = useSubmit((body) => submitSurvey(requestId, body));

  async function handleSubmit(event) {
    event.preventDefault();
    if (!score) {
      setLocalError('Elige una calificación.');
      return;
    }
    setLocalError(null);
    const result = await submit({ calificacion: score, comentario });
    if (result.ok) setOutcome('Gracias por tu respuesta');
    else if (result.error?.status === 409) setOutcome('Ya respondiste esta encuesta');
  }

  const failure = error && error.status !== 409 ? error.fieldErrors?.calificacion || error.detail : null;

  return (
    <section className="card" aria-labelledby={`${groupId}-titulo`}>
      <h2 id={`${groupId}-titulo`}>Encuesta de satisfacción</h2>
      {outcome ? (
        <p className="notice notice--success" role="status">{outcome}</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <p className="card__lead">La solicitud está cerrada. Tu respuesta se envía una sola vez y ayuda a mejorar el servicio.</p>
          <fieldset className="rating" aria-describedby={localError ? `${groupId}-error` : undefined}>
            <legend className="field__label">Calificación</legend>
            <span className="rating__hint" aria-hidden="true">Muy mala</span>
            {SCORES.map((value) => (
              <label key={value} className="rating__option">
                <input
                  type="radio"
                  name={`calificacion-${groupId}`}
                  value={value}
                  checked={score === value}
                  onChange={() => setScore(value)}
                />
                <span>{value}</span>
              </label>
            ))}
            <span className="rating__hint" aria-hidden="true">Muy buena</span>
          </fieldset>
          {localError && <p className="field__error" id={`${groupId}-error`}>{localError}</p>}
          <TextArea
            label="Comentario (opcional)"
            name="comentario"
            rows={3}
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
          />
          {failure && <p className="form-error" role="alert">{failure}</p>}
          <div className="form-actions">
            <Button type="submit" pending={pending}>Enviar encuesta</Button>
          </div>
        </form>
      )}
    </section>
  );
}
