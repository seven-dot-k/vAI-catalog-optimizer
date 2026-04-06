import { describe, it, expect, beforeEach } from "vitest";
import {
  saveProductUpdates,
  getProductsWithOverrides,
  resetStore,
} from "@/lib/data/store";

describe("saveProductUpdates", () => {
  beforeEach(() => {
    resetStore();
  });

  it("saves content updates for a product", () => {
    saveProductUpdates([
      {
        sku: "ELEC-001",
        content: {
          shortDescription: "Updated short",
          longDescription: "Updated long",
        },
      },
    ]);

    const products = getProductsWithOverrides("electronics");
    const updated = products.find((p) => p.sku === "ELEC-001");
    expect(updated!.content.shortDescription).toBe("Updated short");
    expect(updated!.content.longDescription).toBe("Updated long");
  });

  it("saves SEO updates for a product", () => {
    saveProductUpdates([
      {
        sku: "ELEC-001",
        seoContent: {
          metaTitle: "New Meta Title",
          metaDescription: "New meta description",
        },
      },
    ]);

    const products = getProductsWithOverrides("electronics");
    const updated = products.find((p) => p.sku === "ELEC-001");
    expect(updated!.seoContent.metaTitle).toBe("New Meta Title");
  });

  it("does not affect non-updated products", () => {
    saveProductUpdates([
      {
        sku: "ELEC-001",
        content: {
          shortDescription: "Updated",
          longDescription: "Updated",
        },
      },
    ]);

    const products = getProductsWithOverrides("electronics");
    const unchanged = products.find((p) => p.sku === "ELEC-002");
    expect(unchanged!.content.shortDescription).toBe(
      "Compact USB-C hub with 7 ports."
    );
  });

  it("saves multiple products at once", () => {
    saveProductUpdates([
      {
        sku: "ELEC-001",
        content: { shortDescription: "Updated 1", longDescription: "Long 1" },
      },
      {
        sku: "ELEC-002",
        content: { shortDescription: "Updated 2", longDescription: "Long 2" },
      },
    ]);

    const products = getProductsWithOverrides("electronics");
    expect(
      products.find((p) => p.sku === "ELEC-001")!.content.shortDescription
    ).toBe("Updated 1");
    expect(
      products.find((p) => p.sku === "ELEC-002")!.content.shortDescription
    ).toBe("Updated 2");
  });
});
