/** Facts about the company and the person, used across the site. Change them here only. */

export const company = {
  name: 'Better Code AB',
  orgNr: '556784-8295',
  founded: 2009,
  city: 'Stockholm',
  country: 'Sweden',
} as const;

export const person = {
  name: 'Max Wenzin',
  role: 'Software engineer and architect',
  /** Split so the address never appears whole in the HTML; src/scripts/email.ts joins it. */
  email: { user: 'max.wenzin', domain: 'bettercode.se' },
  /** First job after university (Skandia). The site shows years of experience rounded down to 5. */
  careerStart: 2001,
  crispSince: 2011,
} as const;

export const links = {
  linkedin: 'https://www.linkedin.com/in/maxwenzin/',
  github: 'https://github.com/betrcode',
  crispProfile: 'https://www.crisp.se/en/consultants/max-wenzin',
  crisp: 'https://www.crisp.se/en',
  crispDna: 'https://dna.crisp.se/docs/index.html',
} as const;

/** "20" until 2027, then "25" until 2032: full years since careerStart, rounded down to a multiple of 5. */
export function experienceYears(today = new Date()): number {
  const fullYears = today.getUTCFullYear() - person.careerStart - 1;
  return Math.floor(fullYears / 5) * 5;
}

export const siteTitle = 'Better Code';
export const siteDescription =
  'Better Code AB is the company of Max Wenzin, a software engineer and architect in Stockholm who builds business-critical systems and the teams behind them.';

/**
 * Search engine switch. While false, every page has a noindex tag and robots.txt disallows
 * everything. True since launch on www.bettercode.se (2026-11-26).
 */
export const searchIndexing = true;
