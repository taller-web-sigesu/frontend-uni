import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/index.js';
import { homePathFor } from './homePath.js';
import { PasswordForm } from './PasswordForm.jsx';
import { useSession } from './SessionProvider.jsx';

/** P02: cambio obligatorio del primer ingreso (también accesible con sesión normal). */
export default function ChangePasswordPage() {
  const { changePassword, logout } = useSession();
  const navigate = useNavigate();

  return (
    <div className="auth-blocking">
      <p className="auth-kicker">Primer ingreso · paso bloqueante</p>
      <section className="auth-card auth-card--narrow">
        <h1 className="auth-card__title">Cambia tu contraseña</h1>
        <p className="auth-card__lead">
          Por seguridad, debes reemplazar la contraseña inicial antes de continuar. Este paso no se puede omitir.
        </p>
        <PasswordForm
          onSubmit={changePassword}
          onSuccess={(response) => {
            if (response) navigate(homePathFor(response.usuario.rol), { replace: true });
          }}
        />
        <div className="auth-card__secondary">
          <Button variant="ghost" onClick={logout}>Cerrar sesión</Button>
        </div>
      </section>
    </div>
  );
}
