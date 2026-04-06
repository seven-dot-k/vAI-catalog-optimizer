import { describe, it, expect } from "vitest";
import { getProducts } from "@/lib/data/products";

describe("getProducts", () => {
  it("returns all products when no category specified", () => {
    const products = getProducts();
    expect(products.length).toBeGreaterThan(0);
    expect(products.length).toBe(16);
  });

  it("filters by category", () => {
    const electronics = getProducts("electronics");
    expect(electronics.length).toBe(6);
    expect(electronics.every((p) => p.category === "electronics")).toBe(true);
  });

  it("returns empty array for non-existent category", () => {
    const empty = getProducts("nonexistent");
    expect(empty).toHaveLength(0);
  });

  it("returns products with required fields", () => {
    const products = getProducts("sports");
    for (const product of products) {
      expect(product.name).toBeTruthy();
      expect(product.sku).toBeTruthy();
      expect(product.category).toBe("sports");
      expect(product.content.shortDescription).toBeTruthy();
      expect(product.content.longDescription).toBeTruthy();
      expect(product.seoContent.metaTitle).toBeTruthy();
      expect(product.seoContent.metaDescription).toBeTruthy();
    }
  });

  it("is case-insensitive on category filter", () => {
    const result = getProducts("Electronics");
    expect(result.length).toBe(6);
  });
});
