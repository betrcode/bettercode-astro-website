import { getCollection, type CollectionEntry } from 'astro:content';

export type LegacyArticle = CollectionEntry<'legacy'>;

const FILE_NAME = /^(\d{4})-(\d{2})-(\d{2})-(.+)$/;
const MORE = '<!--more-->';
const DESCRIPTION_LENGTH = 160;

/** The URL parts Jekyll used: /<year>/<month>/<day>/<slug>.html. */
export function legacyParams(article: LegacyArticle) {
  const match = FILE_NAME.exec(article.id);
  if (!match) throw new Error(`Legacy article ${article.id} is not named <yyyy>-<mm>-<dd>-<slug>.md`);
  const [, year, month, day, slug] = match;
  return { year, month, day, slug };
}

export function legacyPath(article: LegacyArticle): string {
  const { year, month, day, slug } = legacyParams(article);
  return `/${year}/${month}/${day}/${slug}.html`;
}

/** Newest first, like the old blog's front page. */
export async function legacyArticles(): Promise<LegacyArticle[]> {
  const articles = await getCollection('legacy');
  return articles.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** A plain-text summary: the text before <!--more-->, or the first paragraph after it. */
export function legacyExcerpt(article: LegacyArticle): string {
  const body = article.body ?? '';
  const [before, after = ''] = body.split(MORE);
  const source = before.trim() || firstParagraph(after);
  return truncate(toPlainText(source), DESCRIPTION_LENGTH);
}

function firstParagraph(markdown: string): string {
  return markdown.split(/\n\s*\n/).map(toPlainText).find((p) => p.length > 40) ?? '';
}

function toPlainText(markdown: string): string {
  return markdown
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, text.lastIndexOf(' ', length - 1)) + '…';
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}
