import { useState } from 'react';
import { Link } from 'react-router';
import { Button, TextField } from '../../components/ui/index.js';
import { useSubmit } from '../../services/useSubmit.js';
import { useSession } from './SessionProvider.jsx';

const LOGIN_MESSAGES = {
  401: 'Correo o contraseña incorrectos',
  429: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  CUENTA_PENDIENTE: 'Tu cuenta está pendiente de aprobación por un administrador.',
  CUENTA_RECHAZADA: 'Tu cuenta fue rechazada. Comunícate con la administración.',
};

const LOGOUT_PENDING = 'No se pudo confirmar el cierre de sesión. Reintenta para revocarla en el servidor.';

function loginMessage(error) {
  if (!error || error.status === 400) return null;
  return LOGIN_MESSAGES[error.codigo] || LOGIN_MESSAGES[error.status] || error.detail;
}

const FEATURES = [
  ['Solicitudes', 'Registra y sigue el estado de tus casos.'],
  ['Reservas', 'Consulta disponibilidad y reserva ambientes.'],
  ['Perfil', 'Datos de tu cuenta y cambio de contraseña.'],
];

/** P01. Tras el ingreso, PublicOnly lleva al destino que corresponde. */
export default function LoginPage() {
  const { login, logoutPending, retryLogout } = useSession();
  const { submit, pending, error, fieldErrors } = useSubmit(login);
  const [values, setValues] = useState({ correo: '', contrasena: '' });
  const [localErrors, setLocalErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const change = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = {};
    if (!values.correo.trim()) errors.correo = 'Ingresa tu correo.';
    if (!values.contrasena) errors.contrasena = 'Ingresa tu contraseña.';
    setLocalErrors(errors);
    if (Object.keys(errors).length) return;
    await submit({ correo: values.correo.trim(), contrasena: values.contrasena });
  }

  const message = loginMessage(error);

  return (
    <div className="auth-split">
      <section className="auth-intro" aria-label="Presentación">
        <p className="auth-kicker">Universidad Actúa</p>
        <p className="auth-brand">UniService</p>
        <h2 className="auth-intro__title">Mesa de ayuda universitaria</h2>
        <p className="auth-intro__lead">Registra solicitudes, sigue su estado y reserva ambientes desde un solo lugar.</p>
        <dl className="auth-features">
          {FEATURES.map(([term, description]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="auth-card">
        <h1 className="auth-card__title">Iniciar sesión</h1>
        <p className="auth-card__lead">Usa tu correo institucional.</p>

        {logoutPending && (
          <div className="notice notice--warning" role="alert">
            <p>{LOGOUT_PENDING}</p>
            <Button variant="secondary" onClick={retryLogout}>Reintentar</Button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label="Correo institucional"
            name="correo"
            type="email"
            autoComplete="username"
            value={values.correo}
            onChange={change('correo')}
            error={localErrors.correo || fieldErrors.correo}
          />
          <TextField
            label="Contraseña"
            name="contrasena"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={values.contrasena}
            onChange={change('contrasena')}
            error={localErrors.contrasena || fieldErrors.contrasena}
          />
          <div className="auth-card__toggle">
            <button
              type="button"
              className="link-button"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
            >
              Mostrar contraseña
            </button>
          </div>
          {message && <p className="form-error" role="alert">{message}</p>}
          <Button type="submit" pending={pending}>Ingresar</Button>
        </form>

        <p className="auth-card__footnote">
          Nunca revelamos si falló el correo o la contraseña. Si olvidaste tu clave, contacta a soporte.
        </p>
        <p className="auth-card__footnote">
          ¿Eres estudiante y no tienes cuenta? <Link to="/registro">Crear cuenta</Link>
        </p>
      </section>
    </div>
  );
}
