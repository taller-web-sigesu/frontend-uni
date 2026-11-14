import { useState } from 'react';
import { Link } from 'react-router';
import { Button, TextField } from '../../components/ui/index.js';
import { useSubmit } from '../../services/useSubmit.js';
import {
  AlertIcon, ArrowRightIcon, ArrowUpRightIcon, CalendarIcon, EyeIcon, EyeOffIcon,
  LockIcon, LoginIllustration, MailIcon, ShieldIcon, TicketIcon, UserIcon,
} from './LoginArt.jsx';
import { useSession } from './SessionProvider.jsx';
import './login.css';

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
  { term: 'Solicitudes', description: 'Registra y sigue el estado de tus casos.', icon: <TicketIcon /> },
  { term: 'Reservas', description: 'Consulta disponibilidad y reserva ambientes.', icon: <CalendarIcon /> },
  { term: 'Perfil', description: 'Datos de tu cuenta y cambio de contraseña.', icon: <UserIcon /> },
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
    <div className="login-page">
      <section className="login-hero" aria-label="Presentación">
        <span className="login-hero__glow" aria-hidden="true" />
        <span className="login-hero__dots" aria-hidden="true" />

        <header className="login-brand">
          <span className="login-brand__mark" aria-hidden="true">U</span>
          <span className="login-brand__copy">
            <span className="login-brand__name">UniService</span>
            <span className="login-brand__institution">Universidad Actúa</span>
          </span>
        </header>

        <p className="login-hero__eyebrow">Portal de servicios académicos</p>
        <h2 className="login-hero__title">
          Mesa de ayuda <span className="login-hero__highlight">universitaria</span>
        </h2>
        <p className="login-hero__lead">
          Registra solicitudes, sigue su estado y reserva ambientes desde un solo lugar.
        </p>

        <LoginIllustration />

        <ul className="login-features" aria-label="Servicios disponibles">
          {FEATURES.map(({ term, description, icon }) => (
            <li key={term} className="login-feature">
              {icon}
              <p className="login-feature__term">{term}</p>
              <p className="login-feature__desc">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="login-card">
        <span className="login-card__accent" aria-hidden="true" />
        <p className="login-card__badge">Acceso institucional</p>
        <h1 className="login-card__title">Iniciar sesión</h1>
        <p className="login-card__lead">Usa tu correo institucional para entrar a tu mesa de ayuda.</p>

        {logoutPending && (
          <div className="notice notice--warning login-card__notice" role="alert">
            <p>{LOGOUT_PENDING}</p>
            <Button variant="secondary" onClick={retryLogout}>Reintentar</Button>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <TextField
              label="Correo institucional"
              name="correo"
              type="email"
              autoComplete="username"
              value={values.correo}
              onChange={change('correo')}
              error={localErrors.correo || fieldErrors.correo}
            />
            <span className="login-field__icon" aria-hidden="true"><MailIcon /></span>
          </div>

          <div className="login-field login-field--password">
            <TextField
              label="Contraseña"
              name="contrasena"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={values.contrasena}
              onChange={change('contrasena')}
              error={localErrors.contrasena || fieldErrors.contrasena}
            />
            <span className="login-field__icon" aria-hidden="true"><LockIcon /></span>
            <button
              type="button"
              className="login-password-toggle"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
            >
              {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
            </button>
          </div>

          {message && (
            <div className="login-alert" role="alert">
              <AlertIcon size={17} />
              <p>{message}</p>
            </div>
          )}

          <Button type="submit" pending={pending} className="login-submit">
            <span>{pending ? 'Ingresando…' : 'Ingresar'}</span>
            {!pending && <ArrowRightIcon />}
          </Button>
        </form>

        <div className="login-card__security">
          <ShieldIcon size={17} />
          <p>
            Nunca revelamos si falló el correo o la contraseña. Si olvidaste tu clave, contacta a soporte.
          </p>
        </div>

        <p className="login-divider"><span>¿Primera vez?</span></p>
        <p className="login-register">
          ¿Eres estudiante y no tienes cuenta?{' '}
          <Link to="/registro">
            Crear cuenta <ArrowUpRightIcon size={14} />
          </Link>
        </p>
      </section>
    </div>
  );
}
