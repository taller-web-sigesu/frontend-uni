import '@testing-library/jest-dom/vitest';
import './msw.js';
import { registerMockData } from '../services/pendingContract.js';
import { db } from '../mocks/state.js';

registerMockData(db);

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
