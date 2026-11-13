import { useState } from 'react';
import { Button, Dialog, TextField } from '../../../components/ui/index.js';
import { useSubmit } from '../../../services/useSubmit.js';
import { resetPassword } from '../usersApi.js';

/**
 * Restablecimiento (HU-29). La contraseña temporal vive solo en el estado de
 * este componente: quien lo usa lo desmonta al cerrar, así que no queda en ningún lado.
 */
export function ResetPasswordDialog({ user, onClose }) {
  const [temporal, setTemporal] = useState(null);
  const [copied, setCopied] = useState(null);
  const { submit, pending, error } = useSubmit(() => resetPassword(user.id));

  async function confirm() {
    const result = await submit();
    if (result.ok) setTemporal(result.data.contrasenaTemporal);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(temporal);
      setCopied('Copiada');
    } catch {
      setCopied('No se pudo copiar; selecciónala y cópiala manualmente.');
    }
  }

  const footer = temporal ? (
    <Button onClick={onClose}>Listo</Button>
  ) : (
    <>
      <Button variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button>
      <Button variant="danger" pending={pending} onClick={confirm}>Restablecer</Button>
    </>
  );

  return (
    <Dialog open title="Restablecer contraseña" onClose={pending ? undefined : onClose} footer={footer}>
      {temporal ? (
        <>
          <p className="notice notice--warning" role="status">Esta contraseña no se volverá a mostrar</p>
          <div className="inline-form">
            <TextField
              label="Contraseña temporal"
              name="contrasenaTemporal"
              value={temporal}
              readOnly
              className="field__control mono"
              onFocus={(event) => event.target.select()}
            />
            <Button variant="secondary" onClick={copy}>Copiar</Button>
          </div>
          {copied && <p className="field__hint" role="status">{copied}</p>}
          <p>Entrégasela a {user.nombreCompleto}: deberá cambiarla en su próximo ingreso.</p>
        </>
      ) : (
        <>
          <p>¿Restablecer la contraseña de {user.nombreCompleto}? Se cerrarán sus sesiones activas.</p>
          {error && <p className="form-error" role="alert">{error.detail}</p>}
        </>
      )}
    </Dialog>
  );
}
