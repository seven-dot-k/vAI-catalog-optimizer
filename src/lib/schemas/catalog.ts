import { z } from "zod";

export const catalogContentSchema = z.object({
  shortDescription: z.string(),
  longDescription: z.string(),
});

export const seoContentSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
});

export const productSchema = z.object({
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  content: catalogContentSchema,
  seoContent: seoContentSchema,
});

export const categorySchema = z.object({
  name: z.string(),
  id: z.string(),
  catalog: z.string(),
  content: catalogContentSchema,
  seoContent: seoContentSchema,
});

export const promotionDataSchema = z.object({
  name: z.string(),
  couponCode: z.string(),
  value: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  products: z.array(z.string()),
  enabled: z.boolean(),
  applyToOrder: z.boolean(),
});

export type CatalogContent = z.infer<typeof catalogContentSchema>;
export type SEOContent = z.infer<typeof seoContentSchema>;
export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
export type PromotionData = z.infer<typeof promotionDataSchema>;
