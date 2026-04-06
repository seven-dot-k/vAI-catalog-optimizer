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

describe("SEO optimization tool routing (mocked)", () => {
  let mockTools: MockTools;

  const steps: MockStreamStep[] = [
    { toolCalls: [{ toolName: "get_products", args: { categoryId: "electronics" } }] },
    { toolCalls: [{ toolName: "get_brand_voice", args: {} }] },
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
    { textResponse: "I've generated SEO data for your electronics products." },
  ];

  beforeEach(() => {
    mockTools = createMockTools();
  });

  it("calls get_products with categoryId electronics", async () => {
    const model = createMockModel(steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Generate SEO data for electronics products" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.get_products.execute).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "electronics" }),
      expect.anything(),
    );
  });

  it("calls generate_seo_data with entityType product", async () => {
    const model = createMockModel(steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Generate SEO data for electronics products" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.generate_seo_data.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "product",
        brandVoice: expect.any(String),
        items: expect.any(Array),
      }),
      expect.anything(),
    );
  });

  it("does not call generate_descriptions", async () => {
    const model = createMockModel(steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Generate SEO data for electronics products" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.generate_descriptions.execute).not.toHaveBeenCalled();
  });
});

describe.skipIf(!process.env.EVAL_LIVE_LLM)(
  "live LLM: SEO optimization",
  { timeout: 120_000 },
  () => {
    let mockTools: MockTools;

    beforeEach(() => {
      mockTools = createMockTools();
    });

    it("calls generate_seo_data with entityType product", async () => {
      const agent = new DurableAgent({
        model: EVAL_LIVE_MODEL,
        instructions: SYSTEM_PROMPT,
        tools: mockTools,
      });

      await agent.stream({
        messages: [{ role: "user" as const, content: "Generate SEO data for electronics products." }],
        writable: createNoopWritable(),
      });

      expect(mockTools.generate_seo_data.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "product",
        }),
        expect.anything(),
      );
    });

    it("does not call generate_descriptions", async () => {
      const agent = new DurableAgent({
        model: EVAL_LIVE_MODEL,
        instructions: SYSTEM_PROMPT,
        tools: mockTools,
      });

      await agent.stream({
        messages: [{ role: "user" as const, content: "Generate SEO data for electronics products." }],
        writable: createNoopWritable(),
      });

      expect(mockTools.generate_descriptions.execute).not.toHaveBeenCalled();
    });
  },
);
