// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
    worker: { format: "es" },
    optimizeDeps: { exclude: ["pyodide"] },
    ssr: { noExternal: ["@monaco-editor/react"] },
  }
});
