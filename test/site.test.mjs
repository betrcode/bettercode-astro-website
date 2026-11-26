/**
 * Checks the built site in dist/ (run `npm run build` first; `npm run verify` does both).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const read = (path) => readFileSync(join(dist, path), 'utf8');
const legacyUrls = readFileSync(join(root, 'test/legacy-urls.txt'), 'utf8').trim().split('\n');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [relative(dist, path)];
  });
}
const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));

test('every article of the old site is served at its exact old URL', () => {
  for (const url of legacyUrls) assert.ok(existsSync(join(dist, url)), `missing ${url}`);
});

test('the old URLs without .html redirect to the article', () => {
  const redirects = read('_redirects');
  for (const url of legacyUrls) {
    assert.ok(redirects.includes(`\n${url.replace(/\.html$/, '')} ${url} 301`), `no redirect for ${url}`);
  }
});

test('the sitemap lists the front page, the archive and every legacy article', () => {
  const sitemap = read('sitemap.xml');
  for (const path of ['/', '/archive/', ...legacyUrls]) {
    assert.ok(sitemap.includes(`<loc>https://www.bettercode.se${path}</loc>`), `sitemap lacks ${path}`);
  }
});

test('the front page does not link to the archive or the legacy articles', () => {
  const home = read('index.html');
  assert.ok(!home.includes('/archive/'));
  for (const url of legacyUrls) assert.ok(!home.includes(url));
});

test('pages need nothing the CSP blocks: no inline scripts, styles or style attributes', () => {
  for (const file of htmlFiles) {
    const html = read(file);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, `${file} has an inline script`);
    assert.doesNotMatch(html, /<style[\s>]/, `${file} has an inline style element`);
    assert.doesNotMatch(html, /\sstyle="/, `${file} has a style attribute`);
  }
});

test('no word runs into a link (Astro drops the space at a line break before a tag)', () => {
  for (const file of htmlFiles) assert.doesNotMatch(read(file), /[a-z,.]<a\s/i, file);
});

test('the email address is not in the HTML in plain form', () => {
  for (const file of htmlFiles) assert.ok(!read(file).includes('max.wenzin@bettercode.se'), file);
});

test('only website files are deployed', () => {
  const unwanted = files.filter((f) => /(^|\/)\.|\.map$|\.md$|\.ts$|\.mjs$|node_modules/.test(f));
  assert.deepEqual(unwanted, []);
});

test('the icons and the social image are built', () => {
  for (const f of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og.png', 'site.webmanifest', 'tokens.css', 'robots.txt', 'feed.xml', '404.html']) {
    assert.ok(existsSync(join(dist, f)), `missing ${f}`);
  }
});
