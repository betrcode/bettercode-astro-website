import type { APIRoute } from 'astro';
import { palette } from '../brand';

/**
 * The colour tokens as CSS custom properties, generated from src/brand.ts so the palette is
 * defined once. Light is the default; dark follows the visitor's system setting.
 */
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const declarations = (colours: Record<string, string>) =>
  Object.entries(colours)
    .map(([name, value]) => `  --${kebab(name)}: ${value};`)
    .join('\n');

export const GET: APIRoute = () => {
  const css =
    `:root {\n  color-scheme: light dark;\n${declarations(palette.light)}\n}\n` +
    `@media (prefers-color-scheme: dark) {\n  :root {\n${declarations(palette.dark).replace(/^/gm, '  ')}\n  }\n}\n`;
  return new Response(css, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
};
