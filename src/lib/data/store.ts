import type { Product, Category, CatalogContent, SEOContent } from "@/lib/schemas/catalog";
import { getProducts as getInitialProducts } from "./products";
import { getCategories as getInitialCategories } from "./categories";

interface ContentUpdate {
  content?: CatalogContent;
  seoContent?: SEOContent;
}

// POC scope in-memory store for product/category content updates from the chat workflow
const productOverrides = new Map<string, ContentUpdate>();
const categoryOverrides = new Map<string, ContentUpdate>();

export function saveProductUpdates(
  updates: Array<{ sku: string } & ContentUpdate>
): void {
  for (const update of updates) {
    const existing = productOverrides.get(update.sku) ?? {};
    productOverrides.set(update.sku, {
      content: update.content ?? existing.content,
      seoContent: update.seoContent ?? existing.seoContent,
    });
  }
}

export function saveCategoryUpdates(
  updates: Array<{ id: string } & ContentUpdate>
): void {
  for (const update of updates) {
    const existing = categoryOverrides.get(update.id) ?? {};
    categoryOverrides.set(update.id, {
      content: update.content ?? existing.content,
      seoContent: update.seoContent ?? existing.seoContent,
    });
  }
}

export function getProductsWithOverrides(categoryId?: string): Product[] {
  const products = getInitialProducts(categoryId);
  return products.map((p) => {
    const override = productOverrides.get(p.sku);
    if (!override) return p;
    return {
      ...p,
      content: override.content ?? p.content,
      seoContent: override.seoContent ?? p.seoContent,
    };
  });
}

export function getCategoriesWithOverrides(categoryIds?: string[]): Category[] {
  const categories = getInitialCategories(categoryIds);
  return categories.map((c) => {
    const override = categoryOverrides.get(c.id);
    if (!override) return c;
    return {
      ...c,
      content: override.content ?? c.content,
      seoContent: override.seoContent ?? c.seoContent,
    };
  });
}

export function resetStore(): void {
  productOverrides.clear();
  categoryOverrides.clear();
}
