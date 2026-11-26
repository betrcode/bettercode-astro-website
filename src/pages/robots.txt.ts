import type { APIRoute } from 'astro';
import { searchIndexing } from '../site';

// Generated so that `searchIndexing` in src/site.ts is the one launch switch.
export const GET: APIRoute = ({ site }) => {
  const body = searchIndexing
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`
    : '# Not for search engines (searchIndexing in src/site.ts is off for this build).\nUser-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
