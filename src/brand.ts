/**
 * The Better Code identity in one place: logo geometry, logo variants and the colour palette.
 * The website (src/components/Logo.astro, src/styles/tokens.css) and the logo build script
 * (scripts/build-logo.mjs) both read this file, so they can never disagree.
 * See docs/design/design-guidelines.md for how to use them.
 */

/**
 * The symbol is a test matrix: a green "b" and a red "c" drawn in square cells, like a grid
 * of passing and failing tests. Rows are listed top to bottom; G = green cell (the b),
 * R = red cell (the c), . = empty.
 */
export type Matrix = readonly string[];

export interface LogoVariant {
  id: 'classic' | 'compact';
  name: string;
  matrix: Matrix;
  /** Cell size and gap in grid units; one cell plus one gap is the pitch. */
  cell: number;
  gap: number;
  /** Corner radius of each cell, in grid units. */
  radius: number;
  wordmark: { font: 'sans' | 'mono'; weight: number; tracking: number };
}

export const logoVariants: Record<LogoVariant['id'], LogoVariant> = {
  /** Option A: the original 2009 matrix, redrawn on an exact grid. */
  classic: {
    id: 'classic',
    name: 'Classic matrix',
    matrix: ['...RR', 'G.R..', 'GGRRR', 'G.G..', 'GGG..'],
    cell: 7,
    gap: 3,
    radius: 0.6,
    wordmark: { font: 'sans', weight: 600, tracking: -0.025 },
  },
  /** Option B: the same idea on a 4 × 4 grid with fuller cells, made to hold up at 16 px. */
  compact: {
    id: 'compact',
    name: 'Compact matrix',
    matrix: ['..RR', 'G.R.', 'GGRR', 'GG..'],
    cell: 8,
    gap: 2,
    radius: 1.6,
    wordmark: { font: 'mono', weight: 520, tracking: -0.02 },
  },
};

/** The variant the website and favicons use. Switch here, then run `npm run logo`. */
export const activeLogo: LogoVariant['id'] = 'compact';

export interface Cell {
  x: number;
  y: number;
  colour: 'green' | 'red';
}

export function matrixCells(variant: LogoVariant): Cell[] {
  const pitch = variant.cell + variant.gap;
  return variant.matrix.flatMap((row, r) =>
    [...row].flatMap((mark, c) =>
      mark === '.' ? [] : [{ x: c * pitch, y: r * pitch, colour: mark === 'G' ? ('green' as const) : ('red' as const) }],
    ),
  );
}

/** Width (and height: the matrix is square) of the symbol in grid units. */
export function symbolSize(variant: LogoVariant): number {
  return variant.matrix.length * (variant.cell + variant.gap) - variant.gap;
}

/**
 * Colour palette. Light is the default; dark applies when the visitor's system asks for it.
 * Contrast ratios are checked by test/palette.test.mjs.
 */
export const palette = {
  light: {
    paper: '#faf9f6',
    surface: '#f1efe9',
    ink: '#17191c',
    muted: '#5a6068',
    rule: '#dedad1',
    green: '#17824f',
    greenText: '#11673e',
    red: '#c9372c',
    redText: '#a52a21',
  },
  dark: {
    paper: '#111315',
    surface: '#1a1d20',
    ink: '#ecebe6',
    muted: '#a1a7ad',
    rule: '#2d3135',
    green: '#33b873',
    greenText: '#5fd394',
    red: '#ef5d50',
    redText: '#ff8a7e',
  },
} as const;
