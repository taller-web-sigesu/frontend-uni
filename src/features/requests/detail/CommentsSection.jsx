import { useState } from 'react';
import { Button, TextArea } from '../../../components/ui/index.js';
import { formatDateTime } from '../../../services/format.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { addComment } from '../requestsApi.js';

/** Comentarios de seguimiento. Si la publicación falla, el texto se conserva. */
export function CommentsSection({ requestId, comments, onAdded }) {
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState(null);
  const { submit, pending, error, fieldErrors } = useSubmit((contenido) => addComment(requestId, contenido));

  async function handleSubmit(event) {
    event.preventDefault();
    const contenido = text.trim();
    if (!contenido) {
      setLocalError('Escribe un comentario');
      return;
    }
    setLocalError(null);
    const result = await submit(contenido);
    if (result.ok) {
      setText('');
      onAdded(result.data);
    }
  }

  const formError = error && error.status !== 400 ? error.detail : null;

  return (
    <section aria-labelledby="detalle-comentarios">
      <h2 id="detalle-comentarios">Comentarios</h2>
      {comments.length === 0 ? (
        <p className="card__lead">Aún no hay comentarios.</p>
      ) : (
        <ul className="comments">
          {comments.map((comment) => (
            <li key={comment.id} className="comments__item">
              <p className="comments__meta">
                <strong>{comment.autor?.nombreCompleto}</strong>
                <span>{formatDateTime(comment.creadoEn)}</span>
              </p>
              <p className="comments__text">{comment.contenido}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <TextArea
          label="Comentario"
          name="contenido"
          rows={3}
          placeholder="Escribe un comentario…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          error={localError || fieldErrors.contenido}
        />
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="form-actions">
          <Button type="submit" pending={pending}>Publicar comentario</Button>
        </div>
      </form>
    </section>
  );
}
