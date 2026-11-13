import { useState } from 'react';
import { Link } from 'react-router';
import { Button, TextField } from '../../components/ui/index.js';
import { useSubmit } from '../../services/useSubmit.js';
import { register } from './authApi.js';
import { isInstitutionalEmail, validatePassword } from './passwordPolicy.js';

const EMPTY = { nombreCompleto: '', correo: '', contrasena: '', confirmacionContrasena: '' };

function validate(values) {
  const errors = {};
  if (!values.nombreCompleto.trim()) errors.nombreCompleto = 'Ingresa tu nombre completo.';
  if (!values.correo.trim()) errors.correo = 'Ingresa tu correo institucional.';
  else if (!isInstitutionalEmail(values.correo)) errors.correo = 'Usa tu correo institucional @unmsm.edu.pe.';
  const policy = validatePassword(values.contrasena);
  if (policy) errors.contrasena = policy;
  if (!values.confirmacionContrasena) errors.confirmacionContrasena = 'Confirma tu contraseña.';
  else if (values.confirmacionContrasena !== values.contrasena) {
    errors.confirmacionContrasena = 'Las contraseñas no coinciden.';
  }
  return errors;
}

/** HU-27: auto-registro de estudiantes. No inicia sesión ni permite elegir rol. */
export default function RegisterPage() {
  const { submit, pending, error, fieldErrors } = useSubmit(register);
  const [values, setValues] = useState(EMPTY);
  const [localErrors, setLocalErrors] = useState({});
  const [done, setDone] = useState(null);

  const change = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validate(values);
    setLocalErrors(errors);
    if (Object.keys(errors).length) return;
    const result = await submit({
      nombreCompleto: values.nombreCompleto.trim(),
      correo: values.correo.trim(),
      contrasena: values.contrasena,
      confirmacionContrasena: values.confirmacionContrasena,
    });
    if (result.ok) setDone(result.data.mensaje);
  }

  if (done) {
    return (
      <section className="auth-card auth-card--narrow">
        <h1 className="auth-card__title">Crear cuenta</h1>
        <p className="notice notice--success" role="status">{done}</p>
        <Link to="/login">Volver al inicio de sesión</Link>
      </section>
    );
  }

  const duplicated = error?.codigo === 'CORREO_REGISTRADO' ? 'Este correo ya está registrado.' : null;
  const errorFor = (field) => localErrors[field] || fieldErrors[field];
  const formError = error && error.status !== 400 && !duplicated ? error.detail : null;

  return (
    <section className="auth-card auth-card--narrow">
      <h1 className="auth-card__title">Crear cuenta</h1>
      <p className="auth-card__lead">
        Solo para estudiantes con correo @unmsm.edu.pe. Un administrador aprobará tu cuenta.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Nombre completo"
          name="nombreCompleto"
          autoComplete="name"
          value={values.nombreCompleto}
          onChange={change('nombreCompleto')}
          error={errorFor('nombreCompleto')}
        />
        <TextField
          label="Correo institucional"
          name="correo"
          type="email"
          autoComplete="email"
          value={values.correo}
          onChange={change('correo')}
          error={errorFor('correo') || duplicated}
        />
        <TextField
          label="Contraseña"
          name="contrasena"
          type="password"
          autoComplete="new-password"
          hint="De 8 a 72 caracteres, con al menos una letra y un número."
          value={values.contrasena}
          onChange={change('contrasena')}
          error={errorFor('contrasena')}
        />
        <TextField
          label="Confirmar contraseña"
          name="confirmacionContrasena"
          type="password"
          autoComplete="new-password"
          value={values.confirmacionContrasena}
          onChange={change('confirmacionContrasena')}
          error={errorFor('confirmacionContrasena')}
        />
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <Button type="submit" pending={pending}>Registrarme</Button>
      </form>
      <p className="auth-card__footnote">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </section>
  );
}
