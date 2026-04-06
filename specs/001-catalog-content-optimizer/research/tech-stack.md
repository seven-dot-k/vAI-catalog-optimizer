# Tech Stack Recommendations: Catalog Content Optimizer

> Related: [Research Index](./README.md) | [Codebase Analysis](./codebase-analysis.md)

## Core Dependencies

Based on analysis of the flight-booking-app and nextjs-video-ai-workflows
reference projects, current documentation, and AI SDK v6 beta.

### Runtime Dependencies

| Package | Purpose | Version Guidance |
|---------|---------|-----------------|
| `next` | App framework | `^15.x` or `^16.x` |
| `react` / `react-dom` | UI framework | `^19.x` |
| `ai` | Vercel AI SDK core | `^6.x-beta` (v6) |
| `@ai-sdk/react` | React hooks (useChat) | `^3.x` (v6 compat) |
| `@ai-sdk/anthropic` | Anthropic provider | `^3.x` (v6 compat) |
| `workflow` | Vercel Workflows runtime | `^4.x-beta` |
| `@workflow/ai` | AI integration for workflows | `^4.x-beta` |
| `zod` | Schema validation | `^3.x` or `^4.x` |
| `@radix-ui/react-collapsible` | Expandable table rows | Latest |
| `@radix-ui/react-slot` | Component composition | Latest |
| `tailwindcss` | Styling | `^4.x` |
| `lucide-react` | Icons | Latest |
| `class-variance-authority` | Variant styling | Latest |
| `clsx` + `tailwind-merge` | Class utilities | Latest |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `vitest` | Test runner (all tests) |
| `@testing-library/react` | Component testing |
| `@testing-library/jest-dom` | DOM assertions |
| `@workflow/vitest` | Workflow integration testing |
| `@ai-sdk/devtools` | AI SDK debugging middleware |
| `eslint` + `eslint-config-next` | Linting |

## AI SDK v6 Key Changes

We target AI SDK v6 (`ai@6.0.0-beta.*`). Key differences from v5:

| Area | v5 | v6 |
|------|----|----|
| Structured output | `generateObject()` / `streamObject()` | `generateText()` + `Output.object({ schema })` |
| Agent class | `Experimental_Agent` | `ToolLoopAgent` (stopWhen defaults to `stepCountIs(20)`) |
| Tool toModelOutput | `toModelOutput: output => ...` | `toModelOutput: ({ output }) => ...` |
| Test mocks | `MockLanguageModelV2` | `MockLanguageModelV3` (from `ai/test`) |
| Provider packages | `@ai-sdk/*@^2.x` | `@ai-sdk/*@^3.x` |
| Provider interface | `@ai-sdk/provider@^2.x` | `@ai-sdk/provider@^3.x` |

**Structured output pattern (v6):**

```typescript
import { generateText, Output } from "ai";

const { output } = await generateText({
  model: anthropic("claude-haiku-4-5"),
  output: Output.object({
    schema: catalogContentSchema,
  }),
  prompt: `Generate descriptions for: ${product.name}`,
});
```

**Migration tool**: `npx @ai-sdk/codemod v6`

## Architecture Patterns (from reference projects)

### Workflow Definition Pattern (Multi-turn Chat)

```typescript
// workflows/catalog-agent.ts
import { DurableAgent } from "@workflow/ai/agent";
import { defineHook } from "workflow";
import { getWritable, getWorkflowMetadata } from "workflow";

export const chatMessageHook = defineHook({
  schema: z.object({ message: z.string() }),
});

export async function catalogAgentWorkflow(messages: ModelMessage[]) {
  "use workflow";

  const writable = getWritable<UIMessageChunk>();
  const { workflowRunId } = getWorkflowMetadata();

  const agent = new DurableAgent({
    model: "anthropic/claude-sonnet-4-6",
    instructions: SYSTEM_PROMPT,
    tools: catalogTools,
  });

  const hook = chatMessageHook.create({ token: workflowRunId });
  let turn = 0;

  while (true) {
    turn++;
    const result = await agent.stream({
      messages, writable,
      preventClose: true,
      sendStart: turn === 1,
      sendFinish: false,
    });
    messages.push(...result.messages.slice(messages.length));

    const { message } = await hook;
    if (message === "/done") break;
    messages.push({ role: "user", content: message });
  }
}
```

### Per-Item Step Pattern for Bulk Content Generation

**CRITICAL**: Each product/category MUST be its own `"use step"` call.
A single batch step loses:

1. **Retry granularity** — If product #37/50 fails, only that step retries.
   A batch step retries ALL 50 (including re-calling the LLM for already
   completed items).
2. **Observability** — Each step appears individually in the workflow
   trace dashboard. You can see exactly which product failed and why.
3. **Durability** — If the workflow crashes after processing 30 items, it
   resumes at item 31 (completed step results are persisted and replayed).
4. **Streaming** — Each step can emit real-time progress via `getWritable()`.

**Correct pattern — per-item steps with emissions:**

```typescript
// workflows/tools/generate-descriptions.ts
import { getWritable } from "workflow";
import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// Per-item step — individually retryable and observable
async function generateProductDescription(
  product: Product,
  brandVoice: string,
  index: number,
  total: number,
  toolCallId: string,
) {
  "use step";

  const writable = getWritable<UIMessageChunk>();
  const writer = writable.getWriter();

  try {
    // Emit InProgress status
    await writer.write({
      id: `${toolCallId}-${product.sku}-status`,
      type: "data-product-status",
      data: { sku: product.sku, status: "InProgress", progress: index / total },
    });

    // Use smaller model — no chat history, just item + brand voice
    const { output } = await generateText({
      model: anthropic("claude-haiku-4-5"),
      output: Output.object({ schema: catalogContentSchema }),
      prompt: `Brand voice: ${brandVoice}\n\nProduct: ${product.name}\nCurrent short: ${product.content.shortDescription}\nCurrent long: ${product.content.longDescription}\n\nGenerate improved descriptions.`,
    });

    // Emit completed result with generated content
    await writer.write({
      id: `${toolCallId}-${product.sku}-done`,
      type: "data-product-content",
      data: {
        sku: product.sku,
        content: output,
        status: "Done",
        progress: (index + 1) / total,
      },
    });

    return { sku: product.sku, content: output };
  } finally {
    writer.releaseLock();
  }
}
generateProductDescription.maxRetries = 2; // AI calls can be flaky

// Tool orchestrator — iterates per-item steps
export async function generateDescriptions(
  { products, brandVoice }: { products: Product[]; brandVoice: string },
  { toolCallId }: { toolCallId: string },
) {
  const results = [];
  for (let i = 0; i < products.length; i++) {
    const result = await generateProductDescription(
      products[i], brandVoice, i, products.length, toolCallId,
    );
    results.push(result);
  }
  return { generated: results.length, results };
}
```

**Wrong pattern (DO NOT USE):**

```typescript
// BAD: Single step for entire batch — loses all durability benefits
async function generateAllDescriptions(products: Product[]) {
  "use step";
  for (const product of products) {
    // If product #37 fails, ALL 50 retry from scratch
    await generateText({ ... });
  }
}
```

### API Route Pattern (Multi-turn)

```typescript
// app/api/chat/route.ts — Start session
import { start } from "workflow/api";
import { convertToModelMessages, createUIMessageStreamResponse } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const modelMessages = await convertToModelMessages(messages);
  const run = await start(catalogAgentWorkflow, [modelMessages]);
  return createUIMessageStreamResponse({
    stream: run.readable,
    headers: { "x-workflow-run-id": run.runId },
  });
}

// app/api/chat/[id]/route.ts — Follow-up
export async function POST(req: Request, { params }) {
  const { id } = await params;
  const { message } = await req.json();
  await chatMessageHook.resume(id, { message });
  return Response.json({ success: true });
}
```

### Testing Pattern

```typescript
// workflows/__tests__/catalog-agent.integration.test.ts
import { start, getRun } from "workflow/api";
import { waitForHook, resumeHook } from "@workflow/vitest";
import { MockLanguageModelV3 } from "ai/test";

it("should generate content and wait for approval", async () => {
  const run = await start(catalogAgentWorkflow, [initialMessages]);

  // Wait for hook (human approval)
  await waitForHook(run, { token: run.runId });
  await resumeHook(run.runId, { message: "approve" });

  const result = await run.returnValue;
  expect(result.messages).toBeDefined();
});
```

## Next.js Configuration

```typescript
// next.config.ts
import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};
export default withWorkflow(nextConfig);
```

## Model Strategy

| Role | Model | Context | Rationale |
|------|-------|---------|-----------|
| Main agent | `claude-sonnet-4-6` | Full chat history | Orchestration, tool selection, user interaction |
| Content generation | `claude-haiku-4-5` | Single item + brand voice | Cost efficiency, no history needed |

The main agent decides which tools to call. Content generation tools
(`generate_descriptions`, `generate_seo_data`) internally use haiku
with only the current item's data and brand voice — no chat history.

Each product/category is processed as its own `"use step"` for retry
isolation, observability, and crash-safe resume.

## File Structure (Recommended)

```
src/
├── app/
│   ├── page.tsx                    # Main chat + canvas UI
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Tailwind imports
│   └── api/
│       └── chat/
│           ├── route.ts            # Start workflow
│           └── [id]/
│               ├── route.ts        # Follow-up messages
│               └── stream/
│                   └── route.ts    # Stream reconnection
├── components/
│   ├── ui/                         # Radix-based primitives
│   ├── chat/                       # Chat interface components
│   └── catalog/                    # Bulk edit table components
├── lib/
│   ├── data/                       # Mock data + accessors
│   ├── schemas/                    # Zod schemas (shared)
│   └── utils.ts                    # cn() and helpers
├── workflows/
│   ├── catalog-agent.ts            # Main durable agent
│   └── tools/                      # Tool definitions
│       ├── get-products.ts
│       ├── get-categories.ts
│       ├── get-brand-voice.ts
│       ├── generate-descriptions.ts  # Per-item "use step" loop
│       ├── generate-seo-data.ts      # Per-item "use step" loop
│       ├── save-products.ts
│       └── save-categories.ts
└── hooks/
    └── use-multi-turn-chat.ts      # WorkflowChatTransport wrapper
```
