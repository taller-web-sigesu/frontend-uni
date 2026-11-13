import { useState } from 'react';
import { Button, TextField } from '../../components/ui/index.js';
import { useSubmit } from '../../services/useSubmit.js';
import { validatePassword } from './passwordPolicy.js';

const EMPTY = { contrasenaActual: '', contrasenaNueva: '', confirmacion: '' };

function validate(values) {
  const errors = {};
  if (!values.contrasenaActual) errors.contrasenaActual = 'Ingresa tu contraseña actual.';
  const policy = validatePassword(values.contrasenaNueva);
  if (policy) errors.contrasenaNueva = policy;
  if (!values.confirmacion) errors.confirmacion = 'Confirma la nueva contraseña.';
  else if (values.confirmacion !== values.contrasenaNueva) errors.confirmacion = 'Las contraseñas no coinciden.';
  return errors;
}

/**
 * Cambio de contraseña compartido por P02 y P16. La confirmación solo se
 * valida aquí: `onSubmit` recibe `{ contrasenaActual, contrasenaNueva }`.
 * Tras el éxito vacía los campos y llama a `onSuccess(resultado)`.
 */
export function PasswordForm({ onSubmit, onSuccess, submitLabel = 'Cambiar contraseña' }) {
  const { submit, pending, error, fieldErrors } = useSubmit(onSubmit);
  const [values, setValues] = useState(EMPTY);
  const [localErrors, setLocalErrors] = useState({});

  const change = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));
  const errorFor = (field) => localErrors[field] || fieldErrors[field];

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validate(values);
    setLocalErrors(errors);
    if (Object.keys(errors).length) return;
    const result = await submit({
      contrasenaActual: values.contrasenaActual,
      contrasenaNueva: values.contrasenaNueva,
    });
    if (result.ok) {
      setValues(EMPTY);
      onSuccess?.(result.data);
    }
  }

  const formError = error && error.status !== 400 ? error.detail : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        label="Contraseña actual"
        name="contrasenaActual"
        type="password"
        autoComplete="current-password"
        value={values.contrasenaActual}
        onChange={change('contrasenaActual')}
        error={errorFor('contrasenaActual')}
      />
      <TextField
        label="Nueva contraseña"
        name="contrasenaNueva"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        value={values.contrasenaNueva}
        onChange={change('contrasenaNueva')}
        error={errorFor('contrasenaNueva')}
      />
      <TextField
        label="Confirmar nueva contraseña"
        name="confirmacion"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        value={values.confirmacion}
        onChange={change('confirmacion')}
        error={errorFor('confirmacion')}
      />
      <ul className="password-rules">
        <li>De 8 a 72 caracteres</li>
        <li>Al menos una letra y un número</li>
      </ul>
      <p className="field__hint">Al cambiarla se cerrarán las demás sesiones activas.</p>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="form-actions">
        <Button type="submit" pending={pending}>{submitLabel}</Button>
      </div>
    </form>
  );
}
