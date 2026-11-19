import { defineConfig } from '@playwright/test';
import type { SerenityFixtures, SerenityWorkerFixtures } from '@serenity-js/playwright-test';

const PORT = 5199;

export default defineConfig<SerenityFixtures, SerenityWorkerFixtures>({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['line'],
    // Genera el JSON de Serenity BDD en target/site/serenity (luego `npm run serenity:report` crea el HTML)
    ['@serenity-js/playwright-test', {
      crew: [
        '@serenity-js/console-reporter',
        ['@serenity-js/serenity-bdd', { specDirectory: './e2e' }],
        ['@serenity-js/core:ArtifactArchiver', { outputDirectory: 'target/site/serenity' }],
      ],
    }],
  ],
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    defaultActorName: 'Ana',
    crew: [],
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Valores falsos: las llamadas a Supabase se interceptan en las pruebas
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'e2e-publishable-key',
      VITE_SUPABASE_SERVICE_ROLE_KEY: 'e2e-service-key',
    },
  },
});
