import { z } from "zod";

export const productVariantSchema = z.object({
  attribute: z.string(), // e.g., "color", "size"
  value: z.string(), // e.g., "blue", "large"
});

export const generatedImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  createdAt: z.string(),
});

export const productImageSetSchema = z.object({
  productSku: z.string(),
  productName: z.string(),
  variant: productVariantSchema.optional(),
  images: z.array(generatedImageSchema),
});

export type ProductVariant = z.infer<typeof productVariantSchema>;
export type GeneratedImage = z.infer<typeof generatedImageSchema>;
export type ProductImageSet = z.infer<typeof productImageSetSchema>;
