import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import isCI from 'is-ci';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: { entry: 'src/lib/index.tsx', name: 'use-draggable' },
  },
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
