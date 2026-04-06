import { describe, it, expect, beforeEach } from "vitest";
import {
  saveCategoryUpdates,
  getCategoriesWithOverrides,
  resetStore,
} from "@/lib/data/store";

describe("saveCategoryUpdates", () => {
  beforeEach(() => {
    resetStore();
  });

  it("saves content updates for a category", () => {
    saveCategoryUpdates([
      {
        id: "electronics",
        content: {
          shortDescription: "Updated electronics",
          longDescription: "Updated long",
        },
      },
    ]);

    const categories = getCategoriesWithOverrides(["electronics"]);
    expect(categories[0].content.shortDescription).toBe("Updated electronics");
  });

  it("does not affect non-updated categories", () => {
    saveCategoryUpdates([
      {
        id: "electronics",
        content: { shortDescription: "Updated", longDescription: "Updated" },
      },
    ]);

    const categories = getCategoriesWithOverrides(["sports"]);
    expect(categories[0].content.shortDescription).toBe(
      "Gear for active lifestyles."
    );
  });
});
