import type { APIRoute } from 'astro';
import { legacyArticles, legacyPath } from '../lib/legacy';

/** The front page, the archive index and every legacy article. */
export const GET: APIRoute = async ({ site }) => {
  const articles = await legacyArticles();
  const entries = [
    { path: '/' },
    { path: '/archive/' },
    ...articles.map((a) => ({ path: legacyPath(a), lastmod: a.data.date.toISOString().slice(0, 10) })),
  ];
  const urls = entries.map(
    (e) => `  <url><loc>${new URL(e.path, site).href}</loc>${'lastmod' in e ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`,
  );
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
