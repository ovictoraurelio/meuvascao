import { defineCollection } from "astro:content";
import { z } from "zod";
import { glob } from "astro/loaders";

const paginas = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/paginas" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    version: z.string(),
  }),
});
export const collections = { paginas };
