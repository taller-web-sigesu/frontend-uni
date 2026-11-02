import { useEffect, useState } from 'react';

const apiLabels = {
  checking: 'Comprobando conexión',
  online: 'Conectado',
  offline: 'No disponible',
};

export default function App() {
  const [apiState, setApiState] = useState('checking');

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/v1/status', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('El backend respondió con un error.');
        return response.json();
      })
      .then((status) => setApiState(status.status === 'UP' ? 'online' : 'offline'))
      .catch((error) => {
        if (error.name !== 'AbortError') setApiState('offline');
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Universidad Actúa, inicio">
          <span className="brand-mark" aria-hidden="true">U</span>
          <span className="brand-name">Universidad <strong>Actúa</strong></span>
        </a>
        <span className="environment-tag">ENTORNO LOCAL</span>
      </header>

      <main className="main-content">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">SISTEMA UNIVERSITARIO</p>
          <h1 id="page-title">Tu entorno de desarrollo está listo</h1>
          <p className="intro-copy">
            Esta pantalla confirma que React está funcionando. Aquí podrás desarrollar
            la interfaz del sistema.
          </p>
        </section>

        <section className="status-card" aria-labelledby="status-heading">
          <div className="card-heading">
            <div>
              <p className="card-kicker">ESTADO DEL ENTORNO</p>
              <h2 id="status-heading">Servicios locales</h2>
            </div>
            <span className="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4.75 7.25h14.5v10.5H4.75zM8 4.75h8M8 19.25h8M8 10.5h.01M12 10.5h.01M16 10.5h.01M8 14.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>

          <div className="service-row">
            <div className="service-info">
              <span className="service-dot service-dot--online" aria-hidden="true" />
              <div>
                <p className="service-name">Frontend</p>
                <p className="service-detail">React + Vite</p>
              </div>
            </div>
            <span className="service-status service-status--online">Disponible</span>
          </div>

          <div className="service-row service-row--last" aria-live="polite">
            <div className="service-info">
              <span
                className={`service-dot ${apiState === 'online' ? 'service-dot--online' : apiState === 'offline' ? 'service-dot--offline' : 'service-dot--checking'}`}
                aria-hidden="true"
              />
              <div>
                <p className="service-name">Backend</p>
                <p className="service-detail">Spring Boot · API local</p>
              </div>
            </div>
            <span className={`service-status service-status--${apiState}`}>
              {apiLabels[apiState]}
            </span>
          </div>
        </section>

        <p className="footer-note">
          Edita el código desde VS Code. Los cambios del frontend se actualizan en el navegador.
        </p>
      </main>
    </div>
  );
}
