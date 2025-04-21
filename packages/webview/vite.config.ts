/* eslint-env node */
import { join } from 'path';
import * as path from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

let filename = fileURLToPath(import.meta.url);
const PACKAGE_ROOT = path.dirname(filename);

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '/@common/': join(PACKAGE_ROOT, '../common', 'src') + '/',
    },
  },
  plugins: [tailwindcss(), svelte({ hot: !process.env.VITEST }), svelteTesting()],
  optimizeDeps: {
    exclude: [],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globals: true,
    environment: 'jsdom',
    alias: [{ find: '@testing-library/svelte', replacement: '@testing-library/svelte/svelte5' }],
    deps: {
      inline: [

      ],
    },
  },
  base: '',
  server: {
    fs: {
      strict: true,
    },
  },
  build: {
    sourcemap: true,
    //FIXME: remove before publishing
    minify: false,
    outDir: '../extension/media',
    assetsDir: '.',

    emptyOutDir: true,
    reportCompressedSize: false,
  },
});
