import { downloadBlob } from './download.js';

test('downloadBlob usa el nombre y revoca la URL', () => {
  const create = vi.fn(() => 'blob:fake');
  const revoke = vi.fn();
  URL.createObjectURL = create;
  URL.revokeObjectURL = revoke;
  const clicks = [];
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
    clicks.push({ href: this.getAttribute('href'), download: this.download, attached: document.body.contains(this) });
  });
  const blob = new Blob(['codigo\n'], { type: 'text/csv' });

  downloadBlob({ blob, filename: 'solicitudes.csv' });

  expect(create).toHaveBeenCalledWith(blob);
  expect(clicks).toEqual([{ href: 'blob:fake', download: 'solicitudes.csv', attached: true }]);
  expect(revoke).toHaveBeenCalledWith('blob:fake');
  expect(document.querySelector('a[download]')).toBeNull();
  clickSpy.mockRestore();
});

test('downloadBlob sin nombre usa descarga', () => {
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  let name;
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() { name = this.download; });
  downloadBlob({ blob: new Blob(['x']), filename: null });
  expect(name).toBe('descarga');
  clickSpy.mockRestore();
});
