import { vi } from "vitest";
import type { UIMessageChunk } from "ai";
import { getProductsToolDef } from "@/workflows/tools/get-products";
import { getBrandVoiceToolDef } from "@/workflows/tools/get-brand-voice";
import { generateDescriptionsToolDef } from "@/workflows/tools/generate-descriptions";
import { generateSeoDataToolDef } from "@/workflows/tools/generate-seo-data";
import { saveProductsToolDef } from "@/workflows/tools/save-products";

export const EVAL_LIVE_MODEL = "anthropic/claude-haiku-4-5";

// Hardcoded fixture data — decoupled from real data layer per research decision #3
const ELECTRONICS_PRODUCTS = [
  {
    name: "Wireless Headphones Pro",
    sku: "ELEC-001",
    category: "electronics",
    content: {
      shortDescription: "Premium wireless headphones with noise cancellation.",
      longDescription:
        "Our wireless headphones feature active noise cancellation, 30-hour battery life, and premium drivers for exceptional audio quality.",
    },
    seoContent: {
      metaTitle: "Wireless Headphones Pro | Electronics",
      metaDescription: "Buy Wireless Headphones Pro online.",
    },
  },
  {
    name: "USB-C Hub 7-in-1",
    sku: "ELEC-002",
    category: "electronics",
    content: {
      shortDescription: "Compact USB-C hub with 7 ports.",
      longDescription:
        "Expand your connectivity with this 7-in-1 USB-C hub featuring HDMI 4K, USB 3.0, SD card reader, and power delivery passthrough.",
    },
    seoContent: {
      metaTitle: "USB-C Hub 7-in-1 | Electronics",
      metaDescription: "Shop USB-C Hub 7-in-1 online.",
    },
  },
  {
    name: "Smart Watch Series X",
    sku: "ELEC-003",
    category: "electronics",
    content: {
      shortDescription: "Advanced smartwatch with health monitoring.",
      longDescription:
        "Track your fitness and health with the Smart Watch Series X. Features heart rate monitoring, GPS, sleep tracking, and 5-day battery life.",
    },
    seoContent: {
      metaTitle: "Smart Watch Series X | Electronics",
      metaDescription: "Buy Smart Watch Series X online.",
    },
  },
  {
    name: "Portable Bluetooth Speaker",
    sku: "ELEC-004",
    category: "electronics",
    content: {
      shortDescription: "Waterproof Bluetooth speaker with 360 sound.",
      longDescription:
        "Take your music anywhere with this rugged portable speaker. IPX7 waterproof rating, 12 hours of playback, and immersive 360-degree sound.",
    },
    seoContent: {
      metaTitle: "Portable Bluetooth Speaker | Electronics",
      metaDescription: "Shop portable Bluetooth speakers.",
    },
  },
  {
    name: "Mechanical Keyboard RGB",
    sku: "ELEC-005",
    category: "electronics",
    content: {
      shortDescription: "Full-size mechanical keyboard with RGB lighting.",
      longDescription:
        "Enhance your typing experience with Cherry MX switches, per-key RGB backlighting, and a durable aluminum frame.",
    },
    seoContent: {
      metaTitle: "Mechanical Keyboard RGB | Electronics",
      metaDescription: "Shop mechanical keyboards online.",
    },
  },
  {
    name: "4K Webcam Pro",
    sku: "ELEC-006",
    category: "electronics",
    content: {
      shortDescription: "Ultra HD webcam with auto-focus and noise-canceling mic.",
      longDescription:
        "Crystal-clear video calls with 4K resolution, auto-focus, low-light correction, and a built-in noise-canceling microphone.",
    },
    seoContent: {
      metaTitle: "4K Webcam Pro | Electronics",
      metaDescription: "Buy 4K webcams online.",
    },
  },
];

const MOCK_BRAND_VOICE =
  "Friendly, professional, and tech-savvy. Speak with confidence about product features. Use active voice and keep descriptions concise but compelling. Highlight key benefits and differentiators.";

const MOCK_GET_PRODUCTS_RESPONSE = {
  products: ELECTRONICS_PRODUCTS,
  count: ELECTRONICS_PRODUCTS.length,
  message: `Found ${ELECTRONICS_PRODUCTS.length} products in category "electronics"`,
};

const MOCK_GET_BRAND_VOICE_RESPONSE = {
  voice: MOCK_BRAND_VOICE,
  message: "Brand voice retrieved successfully",
};

const MOCK_GENERATE_DESCRIPTIONS_RESPONSE = {
  results: ELECTRONICS_PRODUCTS.map((p) => ({
    itemId: p.sku,
    content: {
      shortDescription: `Optimized: ${p.content.shortDescription}`,
      longDescription: `Optimized: ${p.content.longDescription}`,
    },
    status: "Done" as const,
  })),
  message: `Generated descriptions for ${ELECTRONICS_PRODUCTS.length}/${ELECTRONICS_PRODUCTS.length} products`,
};

const MOCK_GENERATE_SEO_RESPONSE = {
  results: ELECTRONICS_PRODUCTS.map((p) => ({
    itemId: p.sku,
    seoContent: {
      metaTitle: `Optimized: ${p.seoContent.metaTitle}`,
      metaDescription: `Optimized: ${p.seoContent.metaDescription}`,
    },
    status: "Done" as const,
  })),
  message: `Generated SEO data for ${ELECTRONICS_PRODUCTS.length}/${ELECTRONICS_PRODUCTS.length} products`,
};

const MOCK_SAVE_PRODUCTS_RESPONSE = {
  saved: ELECTRONICS_PRODUCTS.length,
  message: `Successfully saved updates for ${ELECTRONICS_PRODUCTS.length} products`,
};

export function createMockTools() {
  return {
    get_products: {
      ...getProductsToolDef,
      execute: vi.fn().mockResolvedValue(MOCK_GET_PRODUCTS_RESPONSE),
    },
    get_brand_voice: {
      ...getBrandVoiceToolDef,
      execute: vi.fn().mockResolvedValue(MOCK_GET_BRAND_VOICE_RESPONSE),
    },
    generate_descriptions: {
      ...generateDescriptionsToolDef,
      execute: vi.fn().mockResolvedValue(MOCK_GENERATE_DESCRIPTIONS_RESPONSE),
    },
    generate_seo_data: {
      ...generateSeoDataToolDef,
      execute: vi.fn().mockResolvedValue(MOCK_GENERATE_SEO_RESPONSE),
    },
    save_products: {
      ...saveProductsToolDef,
      execute: vi.fn().mockResolvedValue(MOCK_SAVE_PRODUCTS_RESPONSE),
    },
  };
}

export type MockTools = ReturnType<typeof createMockTools>;

export function createNoopWritable(): WritableStream<UIMessageChunk> {
  return new WritableStream<UIMessageChunk>({ write() {} });
}

export { ELECTRONICS_PRODUCTS, MOCK_BRAND_VOICE };
