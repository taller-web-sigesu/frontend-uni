import { useState } from 'react';
import { ROLE_LABELS } from '../../services/format.js';
import { areaName } from '../../services/pendingContract.js';
import { PasswordForm } from './PasswordForm.jsx';
import { useSession } from './SessionProvider.jsx';

/** P16. El contrato no expone el correo del usuario en sesión, por eso no se muestra. */
export default function ProfilePage() {
  const { user, changePassword } = useSession();
  const [saved, setSaved] = useState(false);

  return (
    <section className="page">
      <header className="page__header">
        <h1>Perfil y contraseña</h1>
        <p className="page__lead">Datos de tu cuenta y cambio de contraseña</p>
      </header>
      <div className="profile-grid">
        <section className="card" aria-labelledby="perfil-datos">
          <h2 id="perfil-datos">Datos de la cuenta</h2>
          <p className="card__lead">Solo lectura: el perfil se gestiona desde administración.</p>
          <dl className="data-list">
            <div>
              <dt>Nombre completo</dt>
              <dd>{user.nombreCompleto}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{ROLE_LABELS[user.rol] || user.rol}</dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{user.areaId ? (user.areaNombre || areaName(user.areaId)) : 'Sin área asignada'}</dd>
            </div>
          </dl>
        </section>
        <section className="card" aria-labelledby="perfil-contrasena">
          <h2 id="perfil-contrasena">Cambiar contraseña</h2>
          {saved && <p className="notice notice--success" role="status">Contraseña actualizada</p>}
          <PasswordForm
            onSubmit={(data) => {
              setSaved(false);
              return changePassword(data);
            }}
            onSuccess={() => setSaved(true)}
          />
        </section>
      </div>
    </section>
  );
}
