import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://alavanca.vercel.app',
  trailingSlash: 'never',
  output: 'static',
  // Adequa pode levar 20-45s entre extração + chamada Claude.
  // Hobby plan: até 60s. Pro: até 300s.
  adapter: vercel({ maxDuration: 60 }),
  build: {
    format: 'file',
  },
  // CSRF default do Astro 5 rejeita multipart com 403 quando Origin != Host.
  // No Vercel, o alias (cliclabs.vercel.app) e o Host canônico do deployment
  // não batem, então uploads de arquivo eram bloqueados. Os endpoints só são
  // chamados pela própria UI same-origin — segurança preservada.
  security: {
    checkOrigin: false,
  },
});
