import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Articles from the old Jekyll blog (2009–2016). The file name is <date>-<slug>.md, exactly as in
 * Jekyll's _posts, because it decides the URL: /<yyyy>/<mm>/<dd>/<slug>.html.
 */
const legacy = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legacy' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { legacy };
