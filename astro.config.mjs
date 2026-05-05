import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://alavanca.vercel.app',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
