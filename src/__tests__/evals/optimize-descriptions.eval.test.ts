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

describe("optimize electronics descriptions (mocked)", () => {
  let mockTools: MockTools;

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
    { textResponse: "I've generated new descriptions for electronics products." },
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
      messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.get_products.execute).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "electronics" }),
      expect.anything(),
    );
  });

  it("calls get_brand_voice before any generation tool", async () => {
    const model = createMockModel(steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.get_brand_voice.execute).toHaveBeenCalled();

    const brandVoiceOrder = mockTools.get_brand_voice.execute.mock.invocationCallOrder[0];
    const genDescOrder = mockTools.generate_descriptions.execute.mock.invocationCallOrder[0];
    expect(brandVoiceOrder).toBeLessThan(genDescOrder);
  });

  it("calls generate_descriptions with correct parameters", async () => {
    const model = createMockModel(steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.generate_descriptions.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "product",
        brandVoice: expect.any(String),
        items: expect.arrayContaining([
          expect.objectContaining({
            sku: "ELEC-001",
            name: expect.any(String),
          }),
        ]),
      }),
      expect.anything(),
    );
  });
});

describe.skipIf(!process.env.EVAL_LIVE_LLM)(
  "live LLM: optimize electronics descriptions",
  { timeout: 120_000 },
  () => {
    let mockTools: MockTools;

    beforeEach(() => {
      mockTools = createMockTools();
    });

    it("calls get_products with categoryId electronics", async () => {
      const agent = new DurableAgent({
        model: EVAL_LIVE_MODEL,
        instructions: SYSTEM_PROMPT,
        tools: mockTools,
      });

      await agent.stream({
        messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics." }],
        writable: createNoopWritable(),
      });

      expect(mockTools.get_products.execute).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: "electronics" }),
        expect.anything(),
      );
    });

    it("calls get_brand_voice before generation", async () => {
      const agent = new DurableAgent({
        model: EVAL_LIVE_MODEL,
        instructions: SYSTEM_PROMPT,
        tools: mockTools,
      });

      await agent.stream({
        messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics." }],
        writable: createNoopWritable(),
      });

      expect(mockTools.get_brand_voice.execute).toHaveBeenCalled();
      expect(mockTools.generate_descriptions.execute).toHaveBeenCalled();

      const brandVoiceOrder = mockTools.get_brand_voice.execute.mock.invocationCallOrder[0];
      const genDescOrder = mockTools.generate_descriptions.execute.mock.invocationCallOrder[0];
      expect(brandVoiceOrder).toBeLessThan(genDescOrder);
    });

    it("calls generate_descriptions with entityType product", async () => {
      const agent = new DurableAgent({
        model: EVAL_LIVE_MODEL,
        instructions: SYSTEM_PROMPT,
        tools: mockTools,
      });

      await agent.stream({
        messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics." }],
        writable: createNoopWritable(),
      });

      expect(mockTools.generate_descriptions.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "product",
          items: expect.any(Array),
        }),
        expect.anything(),
      );
    });

    it("calls save_products immediately after generation", async () => {
      const agent = new DurableAgent({
        model: EVAL_LIVE_MODEL,
        instructions: SYSTEM_PROMPT,
        tools: mockTools,
      });

      await agent.stream({
        messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics." }],
        writable: createNoopWritable(),
      });

      expect(mockTools.save_products.execute).toHaveBeenCalled();
    });
  },
);
