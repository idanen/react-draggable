import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import isCI from 'is-ci';

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./tests.setup.ts'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
      headless: isCI,
    },
    coverage: {
      enabled: isCI,
      provider: 'v8',
      include: ['src/lib/**'],
      reportsDirectory: './coverage',
    },
  },
});
