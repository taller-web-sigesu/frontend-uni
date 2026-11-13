import { Button } from './Button.jsx';
import { Dialog } from './Dialog.jsx';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  pending = false,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onCancel}
      footer={(
        <>
          <Button variant="secondary" onClick={onCancel} disabled={pending}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} pending={pending} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      )}
    >
      {message && <p>{message}</p>}
      {children}
    </Dialog>
  );
}
