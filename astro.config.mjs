// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.bettercode.se',
  // `preserve` keeps the legacy article URLs exactly as Jekyll wrote them: /2011/03/09/slug.html.
  build: { format: 'preserve', inlineStylesheets: 'never' },
  // Shiki writes inline style attributes, which the CSP in public/_headers blocks.
  markdown: { syntaxHighlight: false },
  // Never inline scripts or assets as data: URLs; the CSP only allows files from this origin.
  vite: { build: { assetsInlineLimit: 0 } },
  devToolbar: { enabled: false },
});
