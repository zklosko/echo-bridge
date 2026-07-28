import { defineConfig } from 'electron-vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: 'src/main/index.js',
      },
    },
  },
  preload: {
    build: {
      lib: {
        entry: 'src/preload/index.js',
      },
    },
  },
  renderer: {
    root: 'src/ui',
    plugins: [svelte()],
    build: {
      rollupOptions: {
        input: 'src/ui/index.html',
      },
    },
  },
});
