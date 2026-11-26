/** WCAG contrast checks for the palette in src/brand.ts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { palette } from '../src/brand.ts';

const TEXT = 4.5; // WCAG AA, normal text
const GRAPHICS = 3; // WCAG AA, non-text and large text

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

for (const [mode, c] of Object.entries(palette)) {
  test(`${mode}: text colours reach ${TEXT}:1 on paper and surface`, () => {
    for (const fg of ['ink', 'muted', 'greenText', 'redText']) {
      for (const bg of ['paper', 'surface']) {
        const ratio = contrast(c[fg], c[bg]);
        assert.ok(ratio >= TEXT, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
      }
    }
  });
  test(`${mode}: logo colours reach ${GRAPHICS}:1 on paper, and buttons keep paper text readable`, () => {
    for (const fg of ['green', 'red']) {
      const ratio = contrast(c[fg], c.paper);
      assert.ok(ratio >= GRAPHICS, `${fg} on paper is ${ratio.toFixed(2)}:1`);
    }
    assert.ok(contrast(c.paper, c.green) >= TEXT, `paper on green is ${contrast(c.paper, c.green).toFixed(2)}:1`);
    assert.ok(contrast(c.paper, c.ink) >= TEXT);
  });
}
