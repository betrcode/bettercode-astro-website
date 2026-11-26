import type { APIRoute } from 'astro';
import { legacyArticles, legacyExcerpt, legacyPath } from '../lib/legacy';
import { siteDescription, siteTitle } from '../site';

/** Keeps the old blog's RSS address working for anyone still subscribed. */
const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const articles = await legacyArticles();
  const items = articles.map((a) => {
    const url = new URL(legacyPath(a), site).href;
    return (
      `    <item>\n      <title>${escape(a.data.title)}</title>\n      <link>${url}</link>\n` +
      `      <guid isPermaLink="true">${url}</guid>\n      <pubDate>${a.data.date.toUTCString()}</pubDate>\n` +
      `      <description>${escape(legacyExcerpt(a))}</description>\n    </item>`
    );
  });
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n' +
    `    <title>${escape(siteTitle)}</title>\n    <description>${escape(siteDescription)}</description>\n` +
    `    <link>${new URL('/', site).href}</link>\n` +
    `    <atom:link href="${new URL('/feed.xml', site).href}" rel="self" type="application/rss+xml"/>\n` +
    items.join('\n') +
    '\n  </channel>\n</rss>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
