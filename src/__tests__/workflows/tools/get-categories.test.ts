import { describe, it, expect } from "vitest";
import { getCategories, getCategoryById } from "@/lib/data/categories";

describe("getCategories", () => {
  it("returns all categories when no IDs specified", () => {
    const categories = getCategories();
    expect(categories.length).toBe(4);
  });

  it("filters by category IDs", () => {
    const filtered = getCategories(["electronics", "sports"]);
    expect(filtered.length).toBe(2);
    expect(filtered.map((c) => c.id)).toContain("electronics");
    expect(filtered.map((c) => c.id)).toContain("sports");
  });

  it("returns empty for non-existent IDs", () => {
    const empty = getCategories(["nonexistent"]);
    expect(empty).toHaveLength(0);
  });

  it("returns categories with required fields", () => {
    const categories = getCategories();
    for (const category of categories) {
      expect(category.name).toBeTruthy();
      expect(category.id).toBeTruthy();
      expect(category.catalog).toBeTruthy();
      expect(category.content.shortDescription).toBeTruthy();
      expect(category.content.longDescription).toBeTruthy();
    }
  });
});

describe("getCategoryById", () => {
  it("returns a category by ID", () => {
    const category = getCategoryById("electronics");
    expect(category).toBeDefined();
    expect(category!.name).toBe("Electronics");
  });

  it("returns undefined for non-existent ID", () => {
    const category = getCategoryById("nonexistent");
    expect(category).toBeUndefined();
  });
});
