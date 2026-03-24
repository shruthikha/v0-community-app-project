import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        resolve: {
          alias: {
            '@': path.resolve(dirname, '.'),
          },
        },
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
      {
        resolve: {
          alias: {
            '@': path.resolve(dirname, '.'),
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'lib/**/*.test.{ts,tsx}',
            'app/**/*.test.{ts,tsx}',
            'packages/**/*.test.{ts,tsx}'
          ],
        },
      },
      {
        resolve: {
          alias: {
            '@': path.resolve(dirname, '.'),
          },
        },
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['components/**/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
