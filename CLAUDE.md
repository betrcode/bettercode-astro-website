# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

bettercode.se: a static Astro 7 site (one front page plus the old Jekyll blog posts), served by Cloudflare Workers as static assets only. There is no Worker script. The repository is **public**, so no secrets of any kind may be committed.

## Commands

```sh
npm start                 # install on first run, dev server at :4321, opens browser
npm run dev               # dev server only
npm run check             # astro check (type-check)
npm run build             # astro build → dist/
npm test                  # node:test against dist/ (build first)
npm run verify            # check + build + test; run before every commit
npm run preview           # build, then serve dist/ with wrangler dev (real Cloudflare routing)
npm run logo              # rebuild logo SVGs, favicons, og.png after changing src/brand.ts
node --test --test-name-pattern="sitemap" 'test/*.test.mjs'   # one test
```

Tests in `test/site.test.mjs` read `dist/`, so a stale build gives stale results. `test/palette.test.mjs` imports `src/brand.ts` directly (Node strips the types).

## Deploying

- **By hand:** `wrangler login` on this machine points at a *different* Cloudflare account (Crisp). Always deploy with the Better Code credentials, and never print them:
  `set -a; . ~/.config/xfa2pdfa/cloudflare.env; set +a; npm run deploy`
- **CI:** `.github/workflows/website.yml` checks, builds and tests on PRs and deploys on push to `main` (repo secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`). Don't push to `main` unless asked: a push deploys.
- **PR previews:** the `deploy-preview` label on a PR triggers `.github/workflows/preview.yml`, which builds with `SEARCH_INDEXING=false` and runs `wrangler preview --name pr-<n>` (Workers Previews, needs `preview_urls: true` and the `previews` block in `wrangler.jsonc`). Removing the label or closing the PR deletes it.
- Live at https://www.bettercode.se (canonical). `bettercode.se` and `new.bettercode.se` are Custom Domains on the same Worker and are 301-redirected to www by a zone Redirect Rule (set in the Cloudflare dashboard/API, not in this repo). The deploy token has no DNS permission.

## Architecture that spans files

**Legacy URLs must stay exact** (`/yyyy/mm/dd/slug.html`, as Jekyll wrote them). Three settings work together; change none without the others:
1. `build.format: 'preserve'` in `astro.config.mjs` makes `src/pages/[year]/[month]/[day]/[slug].astro` emit `slug.html`.
2. `html_handling: "none"` in `wrangler.jsonc` stops Cloudflare redirecting `.html` to extensionless URLs.
3. Because of (2), directory URLs don't resolve to `index.html` by themselves: `public/_redirects` maps `/` and `/archive/` with `200` rewrites. **A new page in a new folder needs a rewrite line there.** `_redirects` also holds 301s for old URLs without `.html` and for `/about/` and `/contact/`.

`test/legacy-urls.txt` is the list of old article URLs; tests fail if any is missing from `dist/`, the sitemap or `_redirects`.

**Legacy articles** live in `src/content/legacy/<yyyy>-<mm>-<dd>-<slug>.md` (content collection in `src/content.config.ts`). The file name decides the URL (`src/lib/legacy.ts`). They are listed at `/archive/` and in `sitemap.xml` and `feed.xml`, but must **never be linked from the front page** (a test checks this).

**One source for the brand:** `src/brand.ts` holds the palette, the logo matrix geometry and the active logo variant (`compact`).
- CSS colour tokens are generated from it by `src/pages/tokens.css.ts` (served as `/tokens.css`), not written by hand.
- `scripts/build-logo.mjs` reads it to write `docs/design/logo/*.svg`, `public/favicon.*`, home-screen icons and `public/og.png` (Geist shaped with HarfBuzz into outlines). Re-run `npm run logo` after any palette or logo change; the generated files are committed.
- `Symbol.astro` / `TestRun.astro` render the same matrix inline.

**Strict CSP** (`public/_headers`): no inline scripts, inline styles or `style=` attributes. Consequences:
- Scripts are bundled files (`<script>import '../scripts/x.ts'</script>` in components); `assetsInlineLimit: 0` and `inlineStylesheets: 'never'` in `astro.config.mjs` keep it that way.
- Shiki syntax highlighting is off (it writes inline styles).
- Per-element variation goes in CSS (e.g. `nth-child` delays in `TestRun.astro`), not in `style` attributes.
- A test scans `dist/` for violations.

**Indexing switch:** `searchIndexing` in `src/site.ts` (now `true`). When `false`, every page gets `noindex` and `robots.txt` disallows all. Canonical URLs always use `https://www.bettercode.se`.

**Email** is never written whole into HTML: `Email.astro` splits it and `src/scripts/email.ts` joins it (a test checks).

**Portrait** is picked up automatically from `src/assets/portrait.{jpg,png,webp}`.

## Gotchas

- Astro's HTML compression drops the space at a line break between text and a following tag (`on\n<a>` renders as `on<a>`). Keep such text on one line; a test catches words running into links.
- `wawoff2.decompress` returns a view into shared WASM memory; decompress fonts one at a time and copy (`build-logo.mjs`).
- Only `public/` and Astro output reach `dist/`; docs, scripts and this file are never deployed (a test checks for `.md`, `.ts`, dotfiles and source maps in `dist/`).

## Writing and design

Copy follows `docs/writing-guide.md`: first person as Max, headings without full stops, no hype words, no client names, no relative times ("15 years ago"), and none of the machine-writing patterns it lists. Visual decisions follow `docs/design/design-guidelines.md`; update it in the same commit as any brand change. Describe Crisp correctly: Max is a consultant at Crisp and a co-owner, and Crisp has no employees.
