import { useEffect, useId, useRef } from 'react';

const FOCUSABLE = '[autofocus], .dialog__body input, .dialog__body select, .dialog__body textarea, .dialog__body button, .dialog__footer button, .dialog__close';

export function Dialog({ open, title, onClose, children, footer, className = '' }) {
  const ref = useRef(null);
  const previousFocus = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.hasAttribute('open')) {
      previousFocus.current = document.activeElement;
      dialog.showModal();
      // Mismo comportamiento en todos los navegadores (y jsdom): el foco entra al diálogo.
      const first = dialog.querySelector(FOCUSABLE);
      if (first) first.focus();
      return;
    }
    if (!open) {
      if (dialog.hasAttribute('open')) dialog.close();
      const target = previousFocus.current;
      previousFocus.current = null;
      if (target && typeof target.focus === 'function') target.focus();
    }
  }, [open]);

  function handleCancel(event) {
    // El cierre lo decide el estado de React, no el navegador.
    event.preventDefault();
    onClose?.();
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose?.();
    }
  }

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`.trim()}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
    >
      {open && (
        <div className="dialog__panel">
          <header className="dialog__header">
            <h2 className="dialog__title" id={titleId}>{title}</h2>
            <button type="button" className="dialog__close" aria-label="Cerrar" onClick={() => onClose?.()}>
              <span aria-hidden="true">&times;</span>
            </button>
          </header>
          <div className="dialog__body">{children}</div>
          {footer && <footer className="dialog__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
