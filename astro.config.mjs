import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://alavanca.vercel.app',
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel(),
  build: {
    format: 'file',
  },
});
