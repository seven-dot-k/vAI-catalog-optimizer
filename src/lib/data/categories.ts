import type { Category } from "@/lib/schemas/catalog";

const categories: Category[] = [
  {
    name: "Electronics",
    id: "electronics",
    catalog: "Main Store",
    content: {
      shortDescription: "Gadgets, devices, and tech accessories.",
      longDescription:
        "Explore our collection of electronics including headphones, keyboards, webcams, and smart devices. All products come with manufacturer warranty.",
    },
    seoContent: {
      metaTitle: "Electronics | Main Store",
      metaDescription: "Shop electronics and tech accessories.",
    },
  },
  {
    name: "Sports & Outdoors",
    id: "sports",
    catalog: "Main Store",
    content: {
      shortDescription: "Gear for active lifestyles.",
      longDescription:
        "Find everything you need for your active lifestyle. From running shoes to yoga mats, we carry quality sports and outdoor equipment.",
    },
    seoContent: {
      metaTitle: "Sports & Outdoors | Main Store",
      metaDescription: "Shop sports and outdoor gear.",
    },
  },
  {
    name: "Apparel",
    id: "apparel",
    catalog: "Main Store",
    content: {
      shortDescription: "Clothing and accessories for everyday wear.",
      longDescription:
        "Discover our apparel collection featuring organic cotton basics, denim classics, and premium accessories. Sustainable and stylish.",
    },
    seoContent: {
      metaTitle: "Apparel | Main Store",
      metaDescription: "Shop clothing and accessories.",
    },
  },
  {
    name: "Home & Kitchen",
    id: "home",
    catalog: "Main Store",
    content: {
      shortDescription: "Essentials for your home and kitchen.",
      longDescription:
        "Upgrade your home with our curated selection of cookware, diffusers, and kitchen essentials. Quality items for everyday living.",
    },
    seoContent: {
      metaTitle: "Home & Kitchen | Main Store",
      metaDescription: "Shop home and kitchen essentials.",
    },
  },
];

export function getCategories(categoryIds?: string[]): Category[] {
  if (categoryIds && categoryIds.length > 0) {
    return categories.filter((c) =>
      categoryIds.map((id) => id.toLowerCase()).includes(c.id.toLowerCase())
    );
  }
  return [...categories];
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find(
    (c) => c.id.toLowerCase() === id.toLowerCase()
  );
}
