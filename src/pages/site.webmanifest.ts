import type { APIRoute } from 'astro';
import { palette } from '../brand';
import { siteTitle } from '../site';

export const GET: APIRoute = () =>
  Response.json({
    name: siteTitle,
    short_name: siteTitle,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: palette.light.paper,
    background_color: palette.light.paper,
    display: 'browser',
  });
