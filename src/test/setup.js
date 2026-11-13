import '@testing-library/jest-dom/vitest';
import './msw.js';
import { registerMockData } from '../services/pendingContract.js';
import { db } from '../mocks/state.js';

registerMockData(db);

// El FormData y el File de jsdom no son los de fetch de Node: al enviar un
// multipart el archivo llega como «blob» y pierde su nombre. En el navegador
// no pasa; aquí se usan las clases nativas de Node para que MSW vea lo mismo.
const { File: NodeFile } = await import('node:buffer');
globalThis.File = NodeFile;
globalThis.FormData = (await new Response(new URLSearchParams('a=1')).formData()).constructor;

// jsdom no implementa <dialog> modal: versión mínima para las pruebas.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
