# bettercode.se

The website of Better Code AB: a single page about Max Wenzin and the company, plus the
articles from the old blog at their original addresses. Built with [Astro](https://astro.build)
as a fully static site and served by Cloudflare Workers (static assets only, no Worker code).

| Where | What |
|---|---|
| `src/site.ts` | Company and contact facts, links, and the `searchIndexing` launch switch |
| `src/brand.ts` | Palette, logo geometry and logo options |
| `src/pages/index.astro` | The front page |
| `src/content/legacy/` | Old blog posts; the file name decides the URL (`/yyyy/mm/dd/slug.html`) |
| `src/pages/archive/` | Archive index at `/archive/`, in the sitemap but not linked from the front page |
| `src/components/` | Logo, the animated test-run figure, profile icons, the email link |
| `public/_headers`, `public/_redirects` | Security headers, rewrites and redirects (Cloudflare) |
| `docs/design/` | Design guidelines, logo files and the logo sheet |
| `docs/writing-guide.md` | How we write: voice, headings, patterns to avoid |
| `CLAUDE.md` | Notes for Claude Code working in this repository |

## Run it locally

```sh
npm start
```

That installs the dependencies on the first run, starts the dev server at
http://localhost:4321 and opens it in your browser. Changes show up as you save.

In the Claude desktop app, the same server can be started from the preview pane
(`.claude/launch.json` defines `dev`, and `preview (Cloudflare)` for the production setup).

## Develop

```sh
npm ci
npm run dev       # dev server only, http://localhost:4321
npm run verify    # type-check, build, test
npm run preview   # build and serve with Cloudflare's own asset server (wrangler dev)
npm run logo      # rebuild logo files and icons after changing src/brand.ts
```

Node 24 (see `.nvmrc`).

### Legacy URLs

The old Jekyll site served articles at `/yyyy/mm/dd/slug.html`. To keep those URLs exactly:

- `build.format: 'preserve'` in `astro.config.mjs` writes `[slug].astro` pages as `slug.html`.
- `html_handling: "none"` in `wrangler.jsonc` stops Cloudflare from redirecting `.html` URLs to
  extensionless ones. In return, `/` and `/archive/` are mapped to their `index.html`
  in `public/_redirects`.
- `test/legacy-urls.txt` lists every old article URL; `npm test` fails if one is missing.

When adding a page in a new folder, add its `index.html` rewrite to `public/_redirects`.

## Deploy

The site runs on the Cloudflare account of Better Code, as the Worker `bettercode-website`.
It is currently served at **https://new.bettercode.se** (a Custom Domain, see `wrangler.jsonc`).

### Automatically

Every push to `main` is checked, built, tested and deployed by `.github/workflows/website.yml`.
Pull requests are checked but not deployed. The workflow needs two repository secrets:
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

### By hand

`wrangler login` may point at another Cloudflare account, so deploy with the Better Code
credentials from a file kept outside the repository:

```sh
set -a; . ~/.config/xfa2pdfa/cloudflare.env; set +a
npm run deploy
```

Never commit credentials: this repository is public. `.gitignore` excludes `.env*`,
`.dev.vars*` and `cloudflare.env`.

## Launch checklist (moving bettercode.se and www.bettercode.se)

1. Pick the logo option (`activeLogo` in `src/brand.ts`), run `npm run logo`.
2. Set `searchIndexing = true` in `src/site.ts`.
3. In `wrangler.jsonc`, add Custom Domains for `www.bettercode.se` and `bettercode.se`. Existing
   DNS records for those names (today they point at GitHub Pages) must be removed first, or
   Cloudflare refuses to attach the Custom Domain.
4. Redirect `bettercode.se` to `https://www.bettercode.se` (a Cloudflare Redirect Rule), since
   canonical URLs use `www`, like the old site.
5. Decide whether to keep `new.bettercode.se` (redirect it to `www`) or remove it.
6. Remove the `CNAME` file and the custom domain from the old GitHub Pages repository.
7. Submit `https://www.bettercode.se/sitemap.xml` in Google Search Console.
