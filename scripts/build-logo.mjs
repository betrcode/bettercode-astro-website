#!/usr/bin/env node
/**
 * Builds every logo and icon file from the geometry and palette in src/brand.ts:
 *
 *   docs/design/logo/<variant>-*.svg   symbol and lockups (light, dark, one colour) for each logo option
 *   docs/design/png/logo-sheet.png     both options side by side, light and dark, with 16/32 px checks
 *   public/favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, og.png
 *
 * The wordmark is shaped with HarfBuzz from the Geist fonts the website ships and written as
 * outlines, so the SVG files need no font. Run with `npm run logo` after changing src/brand.ts.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as hb from 'harfbuzzjs';
import { activeLogo, logoVariants, matrixCells, palette, symbolSize } from '../src/brand.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const wawoff2 = require('wawoff2');

const LOGO_DIR = join(root, 'docs/design/logo');
const PNG_DIR = join(root, 'docs/design/png');
const PUBLIC_DIR = join(root, 'public');
const FONT_FILES = {
  sans: 'node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',
  mono: 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',
};
const WORDMARK = 'better code';
/** Gap between symbol and wordmark, as a share of the symbol's height. */
const LOCKUP_GAP = 0.28;

// ---- Fonts and text outlines ---------------------------------------------------------------

// wawoff2 returns a view into its own memory, so decompress one font at a time and copy it out.
const faces = {};
for (const [id, file] of Object.entries(FONT_FILES)) {
  const ttf = Uint8Array.from(await wawoff2.decompress(readFileSync(join(root, file))));
  faces[id] = new hb.Face(new hb.Blob(ttf), 0);
}

/** Shapes a line of text and returns its outline path (y down, baseline at 0) and metrics, in em. */
function shapeText(text, { font: fontId, weight, tracking }) {
  const face = faces[fontId];
  const font = new hb.Font(face);
  font.setVariations([new hb.Variation('wght', weight)]);
  const buffer = new hb.Buffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const upem = face.upem;
  let x = 0;
  const parts = [];
  let ascent = 0;
  for (const g of buffer.getGlyphInfosAndPositions()) {
    const d = font.glyphToPath(g.codepoint);
    if (d) parts.push(`<path transform="translate(${round(x / upem)} 0) scale(${1 / upem} ${-1 / upem})" d="${d}"/>`);
    const ext = font.glyphExtents(g.codepoint);
    if (ext) ascent = Math.max(ascent, ext.yBearing / upem);
    x += g.xAdvance + tracking * upem;
  }
  return { paths: parts.join(''), width: (x - tracking * upem) / upem, ascent };
}

const round = (n) => Math.round(n * 10000) / 10000;

// ---- Drawing ---------------------------------------------------------------------------------

function drawSymbol(variant, colours, x = 0, y = 0, scale = 1) {
  const cells = matrixCells(variant)
    .map((c) => {
      const fill = c.colour === 'green' ? colours.green : colours.red;
      return `<rect x="${c.x}" y="${c.y}" width="${variant.cell}" height="${variant.cell}" rx="${round(variant.radius)}" fill="${fill}"/>`;
    })
    .join('');
  return `<g transform="translate(${x} ${y}) scale(${scale})">${cells}</g>`;
}

/**
 * Lockup geometry: the wordmark's baseline sits on the bottom of the symbol and its ascenders
 * (b, t, d) reach the top of the b's stem, so the two letter b's line up.
 */
function lockup(variant) {
  const size = symbolSize(variant);
  const pitch = variant.cell + variant.gap;
  const stemTop = variant.matrix.findIndex((row) => row.includes('G')) * pitch;
  const text = shapeText(WORDMARK, variant.wordmark);
  const fontSize = (size - stemTop) / text.ascent;
  const textX = size * (1 + LOCKUP_GAP);
  return { size, fontSize, text, textX, width: textX + text.width * fontSize, height: size };
}

function lockupSvg(variant, colours, ink, pad = 0) {
  const l = lockup(variant);
  const w = round(l.width + pad * 2);
  const h = round(l.height + pad * 2);
  return svg(
    w,
    h,
    drawSymbol(variant, colours, pad, pad) +
      `<g fill="${ink}" transform="translate(${round(pad + l.textX)} ${pad + l.size}) scale(${round(l.fontSize)})">${l.text.paths}</g>`,
    `Better Code`,
  );
}

function symbolSvg(variant, colours, { pad = 0, background } = {}) {
  const size = symbolSize(variant);
  const w = size + pad * 2;
  const bg = background ? `<rect width="${w}" height="${w}" fill="${background}"/>` : '';
  return svg(w, w, bg + drawSymbol(variant, colours, pad, pad), 'Better Code');
}

function svg(width, height, body, title) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${title}">` +
    `<title>${title}</title>${body}</svg>\n`
  );
}

const mono = { green: 'currentColor', red: 'currentColor' };

// ---- Raster helpers ---------------------------------------------------------------------------

const png = (svgText, width, height = width) =>
  sharp(Buffer.from(svgText), { density: 600 }).resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

/** An .ico file is a small directory followed by embedded PNG images. */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

// ---- Outputs ---------------------------------------------------------------------------------

function writeVariantFiles(variant) {
  const files = {
    [`${variant.id}-symbol.svg`]: symbolSvg(variant, palette.light),
    [`${variant.id}-symbol-dark.svg`]: symbolSvg(variant, palette.dark),
    [`${variant.id}-symbol-mono.svg`]: symbolSvg(variant, mono),
    [`${variant.id}-lockup-light.svg`]: lockupSvg(variant, palette.light, palette.light.ink),
    [`${variant.id}-lockup-dark.svg`]: lockupSvg(variant, palette.dark, palette.dark.ink),
    [`${variant.id}-lockup-mono.svg`]: lockupSvg(variant, mono, 'currentColor'),
  };
  for (const [name, text] of Object.entries(files)) writeFileSync(join(LOGO_DIR, name), text);
}

/**
 * The favicon is redrawn on a 16-unit grid with whole-unit cells and gaps, so each cell lands
 * on whole pixels at 16, 32 and 48 px instead of blurring across pixel edges.
 */
const ICON_GRID = 16;

function faviconSvg(variant) {
  const n = variant.matrix.length;
  let best = { cell: 1, gap: 1 };
  for (let gap = 1; gap <= 2; gap++) {
    for (let cell = 1; n * cell + (n - 1) * gap <= ICON_GRID; cell++) {
      if (cell >= gap * 2 && cell > best.cell) best = { cell, gap };
    }
  }
  const snapped = { ...variant, ...best, radius: best.cell * (variant.radius / variant.cell) };
  const offset = Math.floor((ICON_GRID - symbolSize(snapped)) / 2);
  return svg(ICON_GRID, ICON_GRID, drawSymbol(snapped, palette.light, offset, offset), 'Better Code');
}

async function writeIcons(variant) {
  const size = symbolSize(variant);
  // Green and red both read on light and dark browser tabs, so one favicon serves both.
  const favicon = faviconSvg(variant);
  writeFileSync(join(PUBLIC_DIR, 'favicon.svg'), favicon);
  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map(async (s) => ({ size: s, data: await png(favicon, s) })));
  writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), ico(images));
  // Home-screen icons get the paper background and room around the mark (iOS and Android crop corners).
  const tile = symbolSvg(variant, palette.light, { pad: size * 0.3, background: palette.light.paper });
  writeFileSync(join(PUBLIC_DIR, 'apple-touch-icon.png'), await png(tile, 180));
  writeFileSync(join(PUBLIC_DIR, 'icon-192.png'), await png(tile, 192));
  writeFileSync(join(PUBLIC_DIR, 'icon-512.png'), await png(tile, 512));
}

/** The image shown when someone shares a link to the site (1200 × 630). */
async function writeSocialImage(variant) {
  const W = 1200;
  const H = 630;
  const l = lockup(variant);
  const scale = 640 / l.width;
  const tagline = shapeText('Software engineer and architect in Stockholm', { font: 'sans', weight: 430, tracking: -0.01 });
  const domain = shapeText('bettercode.se', { font: 'mono', weight: 450, tracking: 0 });
  const left = 96;
  const top = 200;
  const body =
    `<rect width="${W}" height="${H}" fill="${palette.light.paper}"/>` +
    `<g transform="translate(${left} ${top}) scale(${round(scale)})">` +
    drawSymbol(variant, palette.light) +
    `<g fill="${palette.light.ink}" transform="translate(${round(l.textX)} ${l.size}) scale(${round(l.fontSize)})">${l.text.paths}</g></g>` +
    `<g fill="${palette.light.muted}" transform="translate(${left} ${top + l.height * scale + 110}) scale(44)">${tagline.paths}</g>` +
    `<g fill="${palette.light.greenText}" transform="translate(${left} ${H - 72}) scale(30)">${domain.paths}</g>` +
    `<rect x="0" y="${H - 12}" width="${W * 0.62}" height="12" fill="${palette.light.green}"/>` +
    `<rect x="${W * 0.62}" y="${H - 12}" width="${W * 0.38}" height="12" fill="${palette.light.red}"/>`;
  writeFileSync(join(PUBLIC_DIR, 'og.png'), await png(svg(W, H, body, 'Better Code'), W, H));
}

/** One sheet comparing the logo options: lockups on light and dark, and real-size favicon pixels. */
async function writeSheet() {
  const W = 1400;
  const rowH = 300;
  const variants = Object.values(logoVariants);
  const parts = [];
  for (const [i, v] of variants.entries()) {
    const y = i * rowH;
    const l = lockup(v);
    const s = 360 / l.width;
    for (const [j, mode] of ['light', 'dark'].entries()) {
      const c = palette[mode];
      const x = j * 520;
      parts.push(`<rect x="${x}" y="${y}" width="520" height="${rowH}" fill="${c.paper}"/>`);
      parts.push(
        `<g transform="translate(${x + 80} ${y + 120}) scale(${round(s)})">${drawSymbol(v, c)}` +
          `<g fill="${c.ink}" transform="translate(${round(l.textX)} ${l.size}) scale(${round(l.fontSize)})">${l.text.paths}</g></g>`,
      );
    }
    parts.push(`<rect x="1040" y="${y}" width="360" height="${rowH}" fill="${palette.light.surface}"/>`);
    const label = shapeText(`${String.fromCharCode(65 + i)}  ${v.name}`, { font: 'mono', weight: 500, tracking: 0 });
    parts.push(`<g fill="${palette.light.muted}" transform="translate(${1070} ${y + 50}) scale(20)">${label.paths}</g>`);
    parts.push(`<g fill="${palette.dark.muted}" transform="translate(${80} ${y + 50}) scale(20)">${label.paths}</g>`);
  }
  const base = await png(svg(W, rowH * variants.length, parts.join(''), 'Logo options'), W, rowH * variants.length);

  // Real 16 and 32 px renders, enlarged without smoothing, so the sheet shows what a browser tab shows.
  const overlays = [];
  for (const [i, v] of variants.entries()) {
    const fav = faviconSvg(v);
    for (const [k, px] of [16, 32].entries()) {
      const small = await png(fav, px);
      const big = await sharp(small).resize(px * (k === 0 ? 8 : 4), null, { kernel: 'nearest' }).png().toBuffer();
      overlays.push({ input: big, left: 1070 + k * 150, top: i * rowH + 100 });
    }
  }
  writeFileSync(join(PNG_DIR, 'logo-sheet.png'), await sharp(base).composite(overlays).png().toBuffer());
}

mkdirSync(LOGO_DIR, { recursive: true });
mkdirSync(PNG_DIR, { recursive: true });
for (const variant of Object.values(logoVariants)) writeVariantFiles(variant);
await writeIcons(logoVariants[activeLogo]);
await writeSocialImage(logoVariants[activeLogo]);
await writeSheet();
console.log(`Logo files written (active variant: ${activeLogo}).`);
