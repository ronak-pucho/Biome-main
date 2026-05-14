import { z } from "zod";

export const DomainSchema = z.enum(["ecommerce", "food", "rides", "travel", "hospitality"]);

export const SearchRequestSchema = z.object({
  query: z.string().trim().min(1),
  domain: DomainSchema.optional(),
  locale: z.string().trim().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export type SearchRequestDto = z.infer<typeof SearchRequestSchema>;

export const TrackClickSchema = z.object({
  searchId: z.string().trim().optional(),
  itemName: z.string().trim().optional(),
  itemUrl: z.string().url(),
  provider: z.string().trim().min(1),
  price: z.number().nonnegative().optional(),
});

export type TrackClickDto = z.infer<typeof TrackClickSchema>;

export const SuggestionsQuerySchema = z.object({
  q: z.string().trim().min(1),
  domain: DomainSchema.optional(),
});

export type SuggestionsQueryDto = z.infer<typeof SuggestionsQuerySchema>;

