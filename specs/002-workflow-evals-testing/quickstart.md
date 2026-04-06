# Quickstart: Workflow Evals & Testing

**Feature**: `001-workflow-evals-testing`

## Running the Evals

```bash
# Run all evals
npx vitest run src/__tests__/evals/

# Run a specific eval file
npx vitest run src/__tests__/evals/optimize-descriptions.eval.ts

# Run in watch mode during development
npx vitest src/__tests__/evals/
```

## Writing a New Eval Scenario

1. **Define the mock model steps** — What tool calls should the agent make?

```typescript
import { createMockModel } from "./helpers/mock-model";

const mockModel = createMockModel([
  // Step 1: Agent calls get_products
  { toolCalls: [{ toolName: "get_products", args: { categoryId: "electronics" } }] },
  // Step 2: Agent calls get_brand_voice
  { toolCalls: [{ toolName: "get_brand_voice", args: {} }] },
  // Step 3: Agent calls generate_descriptions
  { toolCalls: [{ toolName: "generate_descriptions", args: { /* ... */ } }] },
  // Step 4: Agent responds with text
  { textResponse: "Done.", finishReason: "stop" },
]);
```

2. **Create mock tools** — Clone tool definitions with mocked execute functions:

```typescript
import { createMockTools } from "./helpers/mock-tool-responses";

const mockTools = createMockTools();
```

3. **Run the agent and assert**:

```typescript
import { DurableAgent } from "@workflow/ai/agent";

const agent = new DurableAgent({
  model: () => Promise.resolve(mockModel),
  instructions: SYSTEM_PROMPT,
  tools: mockTools,
});

const result = await agent.stream({ messages, writable });

// Assert tool calls
expect(mockTools.get_products.execute).toHaveBeenCalledWith(
  expect.objectContaining({ categoryId: "electronics" }),
  expect.anything()
);
expect(mockTools.save_products.execute).not.toHaveBeenCalled();
```

## Key Patterns

- **Mock model controls WHAT tools the agent calls** (deterministic — no LLM reasoning)
- **Mock tool execute controls WHAT data the agent receives** (fixtures)
- **Assertions verify BOTH**: correct tool calls from the model AND correct parameters passed to execute
- **Multi-turn**: Call `agent.stream()` twice, appending `result.messages` between turns
