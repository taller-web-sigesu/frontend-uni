import { ATTACHMENT_MESSAGES, MAX_ATTACHMENT_BYTES, validateFiles } from './attachmentRules.js';

const file = (name, size, type = '') => new File([new Uint8Array(size)], name, { type });

test('validateFiles rechaza tipo, tamaño y vacío con el mensaje del servidor', () => {
  const ok = file('foto.JPG', 10);
  const pdf = file('acta', 10, 'application/pdf');
  const exe = file('programa.exe', 10, 'application/x-msdownload');
  const big = file('grande.png', MAX_ATTACHMENT_BYTES + 1, 'image/png');
  const empty = file('vacio.pdf', 0, 'application/pdf');
  const edge = file('limite.png', MAX_ATTACHMENT_BYTES, 'image/png');

  const result = validateFiles([ok, pdf, exe, big, empty, edge], 0);

  expect(MAX_ATTACHMENT_BYTES).toBe(5242880);
  expect(result.valid).toEqual([ok, pdf, edge]);
  expect(result.rejected).toEqual([
    { file: exe, reason: 'Solo se aceptan archivos JPG, PNG o PDF.' },
    { file: big, reason: 'El tamaño máximo es 5 MB.' },
    { file: empty, reason: 'El archivo está vacío.' },
  ]);
});

test('validateFiles corta en el límite de 5 vigentes', () => {
  const files = [file('a.png', 5, 'image/png'), file('b.png', 5, 'image/png'), file('c.png', 5, 'image/png')];
  const result = validateFiles(files, 4);
  expect(result.valid).toEqual([files[0]]);
  expect(result.rejected).toEqual([
    { file: files[1], reason: ATTACHMENT_MESSAGES.limit },
    { file: files[2], reason: ATTACHMENT_MESSAGES.limit },
  ]);
  expect(ATTACHMENT_MESSAGES.limit).toBe('Ya hay 5 evidencias. Elimina una para adjuntar otra.');
});
