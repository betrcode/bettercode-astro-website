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
  experienceYears: 20,
  crispSince: 2011,
} as const;

export const links = {
  linkedin: 'https://www.linkedin.com/in/maxwenzin/',
  github: 'https://github.com/betrcode',
  crispProfile: 'https://www.crisp.se/en/consultants/max-wenzin',
  crisp: 'https://www.crisp.se/en',
  crispDna: 'https://dna.crisp.se/docs/index.html',
} as const;

export const siteTitle = 'Better Code';
export const siteDescription =
  'Better Code AB is the company of Max Wenzin, a software engineer and architect in Stockholm who builds business-critical systems and the teams behind them.';

/**
 * The launch switch. While false, every page has a noindex tag and robots.txt disallows
 * everything, so the preview at new.bettercode.se stays out of search results. Set it to true
 * when bettercode.se and www.bettercode.se point at this site.
 */
export const searchIndexing = false;
