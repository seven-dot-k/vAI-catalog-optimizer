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
  variantGroupId: z.string().optional(), // Links image to a variant group
});

// A variant group is a combination of variants (e.g., color:blue + size:large)
export const variantGroupSchema = z.object({
  id: z.string(),
  name: z.string(), // Display name like "Blue / Large"
  variants: z.array(productVariantSchema), // Array of variant conditions
  color: z.string().optional(), // Visual identifier color
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
export type VariantGroup = z.infer<typeof variantGroupSchema>;
