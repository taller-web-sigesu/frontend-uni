import { useState } from 'react';
import { Button, TextField } from '../../components/ui/index.js';

export const RANGE_ERROR = 'La fecha final debe ser igual o posterior a la inicial';

/**
 * Rango en edición (`draft`) separado del aplicado: solo «Aplicar» lo entrega
 * a `onApply`. Fechas `YYYY-MM-DD` de Lima.
 */
export function DateRangeFilter({ value, onApply }) {
  const [draft, setDraft] = useState(value);
  const inverted = Boolean(draft.desde && draft.hasta && draft.hasta < draft.desde);
  const incomplete = !draft.desde || !draft.hasta;

  function handleSubmit(event) {
    event.preventDefault();
    if (inverted || incomplete) return;
    onApply(draft);
  }

  const set = (key) => (event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <form className="range-filter" onSubmit={handleSubmit} noValidate aria-label="Rango de fechas">
      <TextField label="Desde" name="desde" type="date" value={draft.desde} onChange={set('desde')} />
      <TextField
        label="Hasta"
        name="hasta"
        type="date"
        value={draft.hasta}
        onChange={set('hasta')}
        error={inverted ? RANGE_ERROR : undefined}
      />
      <Button type="submit" variant="secondary" disabled={inverted || incomplete}>Aplicar</Button>
    </form>
  );
}
