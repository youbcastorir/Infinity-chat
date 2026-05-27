import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: '.',
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        input: { main: './index.html' }
      },
      minify: 'esbuild',
      target: 'esnext'
    },
    define: {
      // Inject API key at build time — value comes from .env, never hardcoded
      '__GROQ_KEY_ENV__': JSON.stringify(env.VITE_GROQ_API_KEY || '')
    },
    server: {
      port: 5173,
      open: true,
      cors: true
    },
    preview: {
      port: 4173
    }
  };
});
