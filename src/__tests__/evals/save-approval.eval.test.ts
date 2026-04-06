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

describe("save approval flow (mocked)", () => {
  let mockTools: MockTools;

  const turn1Steps: MockStreamStep[] = [
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
          toolName: "save_products",
          args: {
            updates: [
              { sku: "ELEC-001", content: { shortDescription: "Optimized", longDescription: "Optimized" } },
            ],
          },
        },
      ],
    },
    { textResponse: "I've generated new descriptions and submitted them for your approval. Review them in the panel on the right." },
  ];

  beforeEach(() => {
    mockTools = createMockTools();
  });

  it("turn 1 calls save_products immediately after generation", async () => {
    const model = createMockModel(turn1Steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.save_products.execute).toHaveBeenCalled();
  });

  it("save_products receives correct SKUs", async () => {
    const model = createMockModel(turn1Steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics" }],
      writable: createNoopWritable(),
    });

    expect(mockTools.save_products.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        updates: expect.arrayContaining([
          expect.objectContaining({
            sku: "ELEC-001",
          }),
        ]),
      }),
      expect.anything(),
    );
  });

  it("each save update has content or seoContent", async () => {
    const model = createMockModel(turn1Steps);
    const agent = new DurableAgent({
      model: () => Promise.resolve(model),
      instructions: SYSTEM_PROMPT,
      tools: mockTools,
    });

    await agent.stream({
      messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics" }],
      writable: createNoopWritable(),
    });

    const callArgs = mockTools.save_products.execute.mock.calls[0][0] as {
      updates: Array<{
        sku: string;
        content?: Record<string, string>;
        seoContent?: Record<string, string>;
      }>;
    };

    for (const update of callArgs.updates) {
      expect(
        update.content !== undefined || update.seoContent !== undefined,
      ).toBe(true);
    }
  });
});

describe.skipIf(!process.env.EVAL_LIVE_LLM)(
  "live LLM: save approval flow",
  { timeout: 120_000 },
  () => {
    let mockTools: MockTools;

    beforeEach(() => {
      mockTools = createMockTools();
    });

    it("turn 1 calls save_products immediately after generation", async () => {
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

    it("save_products receives correct SKUs", async () => {
      const agent = new DurableAgent({
        model: EVAL_LIVE_MODEL,
        instructions: SYSTEM_PROMPT,
        tools: mockTools,
      });

      await agent.stream({
        messages: [{ role: "user" as const, content: "Optimize product descriptions for electronics." }],
        writable: createNoopWritable(),
      });

      expect(mockTools.save_products.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          updates: expect.arrayContaining([
            expect.objectContaining({
              sku: expect.stringMatching(/^ELEC-00[1-6]$/),
            }),
          ]),
        }),
        expect.anything(),
      );
    });
  },
);
