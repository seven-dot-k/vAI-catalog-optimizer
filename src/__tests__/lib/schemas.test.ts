import { describe, it, expect } from "vitest";
import {
  catalogContentSchema,
  seoContentSchema,
  productSchema,
  categorySchema,
} from "@/lib/schemas/catalog";
import { brandVoiceSchema } from "@/lib/schemas/brand-voice";

describe("catalogContentSchema", () => {
  it("validates valid content", () => {
    const result = catalogContentSchema.safeParse({
      shortDescription: "A short description",
      longDescription: "A longer description with more detail",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = catalogContentSchema.safeParse({
      shortDescription: "Only short",
    });
    expect(result.success).toBe(false);
  });
});

describe("seoContentSchema", () => {
  it("validates valid SEO content", () => {
    const result = seoContentSchema.safeParse({
      metaTitle: "Page Title",
      metaDescription: "A meta description for search engines",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing metaTitle", () => {
    const result = seoContentSchema.safeParse({
      metaDescription: "Only description",
    });
    expect(result.success).toBe(false);
  });
});

describe("productSchema", () => {
  it("validates a complete product", () => {
    const result = productSchema.safeParse({
      name: "Test Product",
      sku: "TEST-001",
      category: "electronics",
      content: {
        shortDescription: "Short",
        longDescription: "Long description",
      },
      seoContent: {
        metaTitle: "Title",
        metaDescription: "Description",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects product without sku", () => {
    const result = productSchema.safeParse({
      name: "Test Product",
      category: "electronics",
      content: {
        shortDescription: "Short",
        longDescription: "Long",
      },
      seoContent: {
        metaTitle: "Title",
        metaDescription: "Description",
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("validates a complete category", () => {
    const result = categorySchema.safeParse({
      name: "Electronics",
      id: "electronics",
      catalog: "Main Store",
      content: {
        shortDescription: "Short",
        longDescription: "Long description",
      },
      seoContent: {
        metaTitle: "Title",
        metaDescription: "Description",
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("brandVoiceSchema", () => {
  it("validates a brand voice", () => {
    const result = brandVoiceSchema.safeParse({
      catalog: "Main Store",
      voice: "Friendly and approachable tone",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing voice", () => {
    const result = brandVoiceSchema.safeParse({
      catalog: "Main Store",
    });
    expect(result.success).toBe(false);
  });
});
