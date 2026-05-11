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
});
