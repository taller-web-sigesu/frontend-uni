import { defineConfig, devices } from '@playwright/test';

const real = process.env.E2E_API === 'real';

/**
 * Modo simulado (CI): `vite preview` de un build con la API simulada en el puerto 4173.
 * Modo real (`E2E_API=real`): el Compose de infra-uni ya sirve el frontend en el puerto 3000.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: !real,
  workers: real ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: real ? 'http://localhost:3000' : 'http://localhost:4173',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
  ],
  webServer: real ? undefined : {
    command: 'npm run preview:mock',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
