import { describe, it, expect, beforeEach } from "vitest";
import { DurableAgent } from "@workflow/ai/agent";
import { SYSTEM_PROMPT } from "@/workflows/catalog-agent";
import { createMockModel, type MockStreamStep } from "./helpers/mock-model";
import {
  createMockTools,
  createNoopWritable,
  EVAL_LIVE_MODEL,
  type MockTools,
} from "./helpers/mock-tool-responses";

describe("edge cases (mocked)", () => {
  let mockTools: MockTools;

  beforeEach(() => {
    mockTools = createMockTools();
  });

  it("empty category returns no generation calls", async () => {
    // Override get_products to return empty
    mockTools.get_products.execute.mockResolvedValue({
      products: [],
      count: 0,
      message: 'Found 0 products in category "kitchen-appliances"',
    });

    const steps: MockStreamStep[] = [
      { toolCalls: [{ toolName: "get_products", args: { categoryId: "kitchen-appliances" } }] },
      { textResponse: "No products found in this category." },
    ];

    const model = createMockModel(steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Optimize product descriptions for kitchen appliances" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.generate_descriptions.execute).not.toHaveBeenCalled();
    expect(mockTools.generate_seo_data.execute).not.toHaveBeenCalled();
  });

  it("optimize all products omits categoryId", async () => {
    const steps: MockStreamStep[] = [
      { toolCalls: [{ toolName: "get_products", args: {} }] },
      { toolCalls: [{ toolName: "get_brand_voice", args: {} }] },
      {
        toolCalls: [
          {
            toolName: "generate_descriptions",
            args: {
              entityType: "product",
              brandVoice: "Friendly, professional, tech-savvy",
              items: [
                {
                  sku: "ELEC-001",
                  name: "Wireless Headphones Pro",
                  content: { shortDescription: "Premium wireless headphones", longDescription: "Our wireless headphones feature active noise cancellation." },
                  seoContent: { metaTitle: "Wireless Headphones Pro", metaDescription: "Buy Wireless Headphones Pro online." },
                },
              ],
            },
          },
        ],
      },
      { textResponse: "I've generated descriptions for all products." },
    ];

    const model = createMockModel(steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Optimize all product descriptions" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.get_products.execute).toHaveBeenCalled();
    const callArgs = mockTools.get_products.execute.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.categoryId).toBeUndefined();
  });

  it("combined descriptions and SEO calls both generation tools", async () => {
    const steps: MockStreamStep[] = [
      { toolCalls: [{ toolName: "get_products", args: { categoryId: "electronics" } }] },
      { toolCalls: [{ toolName: "get_brand_voice", args: {} }] },
      {
        toolCalls: [
          {
            toolName: "generate_descriptions",
            args: {
              entityType: "product",
              brandVoice: "Friendly, professional, tech-savvy",
              items: [
                {
                  sku: "ELEC-001",
                  name: "Wireless Headphones Pro",
                  content: { shortDescription: "Premium wireless headphones", longDescription: "Our wireless headphones feature active noise cancellation." },
                  seoContent: { metaTitle: "Wireless Headphones Pro", metaDescription: "Buy Wireless Headphones Pro online." },
                },
              ],
            },
          },
        ],
      },
      {
        toolCalls: [
          {
            toolName: "generate_seo_data",
            args: {
              entityType: "product",
              brandVoice: "Friendly, professional, tech-savvy",
              items: [
                {
                  sku: "ELEC-001",
                  name: "Wireless Headphones Pro",
                  content: { shortDescription: "Premium wireless headphones", longDescription: "Our wireless headphones feature active noise cancellation." },
                  seoContent: { metaTitle: "Wireless Headphones Pro", metaDescription: "Buy Wireless Headphones Pro online." },
                },
              ],
            },
          },
        ],
      },
      { textResponse: "I've generated descriptions and SEO data." },
    ];

    const model = createMockModel(steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [
        { role: "user" as const, content: "Optimize descriptions and SEO data for electronics products" },
      ],
      writable: createNoopWritable(),
    });

    expect(mockTools.generate_descriptions.execute).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: "product" }),
      expect.anything(),
    );
    expect(mockTools.generate_seo_data.execute).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: "product" }),
      expect.anything(),
    );
  });
});

describe.skipIf(!process.env.EVAL_LIVE_LLM)(
  "live LLM: edge cases",
  { timeout: 120_000 },
  () => {
    let mockTools: MockTools;

    beforeEach(() => {
      mockTools = createMockTools();
    });

    it("empty category — no generation calls", async () => {
      mockTools.get_products.execute.mockResolvedValue({
        products: [],
        count: 0,
        message: 'Found 0 products in category "kitchen-appliances"',
      });

      const agent = new DurableAgent({
        model: EVAL_LIVE_MODEL,
        instructions: SYSTEM_PROMPT,
        tools: mockTools,
      });

      await agent.stream({
        messages: [
          { role: "user" as const, content: "Optimize product descriptions for kitchen appliances." },
        ],
        writable: createNoopWritable(),
      });

      expect(mockTools.generate_descriptions.execute).not.toHaveBeenCalled();
      expect(mockTools.generate_seo_data.execute).not.toHaveBeenCalled();
    });

    it("all products — get_products called without categoryId", async () => {
      const agent = new DurableAgent({
        model: EVAL_LIVE_MODEL,
        instructions: SYSTEM_PROMPT,
        tools: mockTools,
      });

      await agent.stream({
        messages: [{ role: "user" as const, content: "Optimize all product descriptions." }],
        writable: createNoopWritable(),
      });

      expect(mockTools.get_products.execute).toHaveBeenCalled();

      const calls = mockTools.get_products.execute.mock.calls;
      const hasCallWithoutCategory = calls.some((call) => {
        const args = call[0] as Record<string, unknown>;
        return args.categoryId === undefined || args.categoryId === null;
      });
      expect(hasCallWithoutCategory).toBe(true);
    });
  },
);
