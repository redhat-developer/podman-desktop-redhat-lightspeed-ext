
import { join, resolve } from 'node:path';
import { defineProject } from 'vitest/config';

const PACKAGE_ROOT = __dirname;
const WORKSPACE_ROOT = join(PACKAGE_ROOT, '..', '..');

export default defineProject({
  root: PACKAGE_ROOT,
  test: {
    name: 'common',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts}'],
    alias: {
      '@podman-desktop/api': resolve(WORKSPACE_ROOT, '__mocks__/@podman-desktop/api.js'),
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
});