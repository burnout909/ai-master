import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const papers = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/papers" }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    authors: z.string(),
    year: z.number(),
    era: z.string(),
    arxivId: z.string().optional(),
    estimatedMinutes: z.number(),
    prerequisites: z.array(z.string()).default([]),
  }),
});

export const collections = { papers };
