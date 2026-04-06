# Research: Workflow Evals & Testing for Product Content Optimization

**Feature**: `001-workflow-evals-testing`
**Date**: 2026-04-05

## 1. AI SDK Test Utilities (`ai/test`)

### Decision

Use `MockLanguageModelV3` from `ai/test` to script deterministic tool-call sequences. Each eval scenario constructs a mock model that emits a predefined sequence of stream parts (tool calls and text responses) without making real LLM API calls.

### Rationale

- First-party mock utilities from the AI SDK — guaranteed type compatibility with `LanguageModelV3`
- `MockLanguageModelV3` accepts `doStream` as a function or array of `LanguageModelV3StreamResult` values
- `mockValues()` helper cycles through provided values for successive calls (multi-step agents)
- `simulateReadableStream()` creates `ReadableStream<LanguageModelV3StreamPart>` from chunk arrays with configurable delays
- Records all calls via `doStreamCalls` / `doGenerateCalls` for introspection

### Alternatives Considered

- **Vitest `vi.fn()` mocks on tool execute**: Only tests tool execution in isolation; does not verify the agent's tool-call orchestration logic
- **Real LLM calls with low-cost model**: Non-deterministic, slow, flaky, requires API keys in CI — rejected per FR-006 and SC-004
- **Custom mock model class**: Unnecessary when `ai/test` provides `MockLanguageModelV3`

## 2. DurableAgent Integration Testing

### Decision

Pass `MockLanguageModelV3` to `DurableAgent` via `model: () => Promise.resolve(mockModel)` (function form). Mock all tool `execute` functions with `vi.fn()` returning predefined responses. Assert on `result.steps[].toolCalls` and the `vi.fn()` call arguments.

### Rationale

- `DurableAgent` constructor accepts `model: string | (() => Promise<CompatibleLanguageModel>)` — the function form bypasses model string resolution and accepts any `LanguageModelV3` implementation directly
- `result.steps` contains `StepResult[]` where each step has `toolCalls` (array of `{ toolName, toolCallId, input }`) and `finishReason`
- Tool `execute` functions receive `(parsedInput, { toolCallId, messages })` — Vitest `vi.fn()` captures these for parameter assertions
- The `writable` stream parameter requires a `WritableStream<UIMessageChunk>` — can be satisfied with a no-op writable for eval purposes

### Alternatives Considered

- **Testing `catalogAgentWorkflow` directly**: Requires workflow runtime (`"use workflow"` directive, `getWritable`, `getWorkflowMetadata`), which needs the full Vercel Workflows runtime — too complex for unit-level evals
- **Testing via HTTP route (`/api/chat`)**: End-to-end but requires running the full Next.js server and workflow runtime — appropriate for integration tests, not eval scenarios

## 3. Mock Tool Response Strategy

### Decision

Create a `mock-tool-responses.ts` fixture module exporting predefined return values for each product-related tool. Tool definitions are cloned with `execute` replaced by `vi.fn().mockResolvedValue(fixture)`.

### Rationale

- Decouples eval scenarios from real data layer (`@/lib/data/*`)
- Mock responses use the same TypeScript types (`Product[]`, `CatalogContent`, `SEOContent`) ensuring type safety
- Each scenario can override specific mock responses while inheriting defaults
- `vi.fn()` wrappers enable both return-value mocking and call-argument assertions in the same test

### Alternatives Considered

- **Importing real data modules**: Couples tests to data module internals; changes to seed data would break evals
- **Inline mock data per test**: Excessive duplication; extracted fixtures are cleaner and reusable

## 4. Stream Part Construction for Mock Models

### Decision

Use `simulateReadableStream` from `ai/test` to build `LanguageModelV3StreamResult` responses. Each mock model step emits stream parts in this sequence:

1. `{ type: 'stream-start', warnings: [] }`
2. `{ type: 'tool-input-start', id, toolName }` (for tool calls)
3. `{ type: 'tool-input-delta', id, delta: JSON.stringify(args) }` (tool arguments)
4. `{ type: 'tool-input-end', id }`
5. `{ type: 'tool-call', toolCallId, toolName, input: JSON.stringify(args) }` (finalized call)
6. `{ type: 'finish', usage: { inputTokens: 0, outputTokens: 0 }, finishReason: 'tool-calls' }`

For the final text-response step:

1. `{ type: 'stream-start', warnings: [] }`
2. `{ type: 'text-start', id }` → `{ type: 'text-delta', id, delta: '...' }` → `{ type: 'text-end', id }`
3. `{ type: 'finish', usage: { inputTokens: 0, outputTokens: 0 }, finishReason: 'stop' }`

### Rationale

- `LanguageModelV3StreamPart` is a discriminated union — each part type has specific required fields
- `input` field on `tool-call` parts must be a **stringified JSON** (not parsed object)
- Multi-step agents call `doStream` once per step; `mockValues()` sequences the responses

### Alternatives Considered

- **Using `doGenerate` instead of `doStream`**: `DurableAgent.stream()` uses `doStream` internally — must mock the streaming path

## 5. Multi-Turn Conversation Testing

### Decision

For the P2 save-approval scenario, construct the eval as two sequential `agent.stream()` calls. The first call uses messages `[{ role: 'user', content: 'Optimize...' }]`. After asserting turn 1 results, append `result.messages` plus the follow-up user message, then call `agent.stream()` again with the extended history. This simulates multi-turn without needing the workflow hook mechanism.

### Rationale

- The `catalogAgentWorkflow` multi-turn loop uses `chatMessageHook` for follow-up injection — this requires the full workflow runtime
- Calling `DurableAgent.stream()` directly with accumulated messages achieves the same tool-call evaluation without runtime dependencies
- Each turn's `result.steps` can be independently asserted

### Alternatives Considered

- **Mocking the hook mechanism**: Adds complexity and couples tests to workflow internals
- **Single-turn with combined messages**: Does not test the agent's ability to defer saves until explicit approval in a separate turn

## 6. Writable Stream for Evals

### Decision

Create a minimal no-op `WritableStream<UIMessageChunk>` for eval scenarios. The eval does not need to assert on streamed UI chunks — only on tool call results from `DurableAgent.stream()`.

### Rationale

- `DurableAgent.stream()` requires a `writable` parameter
- Tool execute functions in `generate-descriptions.ts` and `generate-seo-data.ts` call `getWritable()` internally (workflow step context) — since we mock the execute functions, these are never reached
- A no-op writable satisfies the type requirement without adding assertion complexity

### Alternatives Considered

- **Collecting UI chunks for assertions**: Out of scope; spec explicitly focuses on tool-call correctness, not UI output

## 7. Live LLM Evals with Mocked Tools

### Decision

Each eval file includes a second `describe` block gated by `describe.skipIf(!process.env.ANTHROPIC_API_KEY)` that runs the same assertions against a real `anthropic/claude-haiku-4-5` model. Tool `execute` functions remain mocked — only the model's reasoning (deciding which tools to call and with what parameters) is live. The model string `"anthropic/claude-haiku-4-5"` is passed directly to `DurableAgent` which resolves it via `gateway()` from the `ai` package.

### Rationale

- **Mocked evals** prove the test infrastructure and assertions work correctly given deterministic tool-call sequences — they validate "if the model calls these tools, do we catch issues?"
- **Live evals** prove the system prompt actually causes a real LLM to call the right tools with the right parameters — they validate "does our prompt work?"
- Colocating both in the same file ensures assertions stay in sync; any new assertion benefits both modes
- `DurableAgent` resolves string models via `gateway(modelInit)` internally (found in `do-stream-step.js`) — no extra provider setup needed
- `describe.skipIf` is a Vitest built-in that cleanly skips the entire block when the condition is true, without failing
- Tool executes are mocked in both modes — only model reasoning differs. No real data fetches or content generation LLM calls occur

### Alternatives Considered

- **Separate `.live.eval.test.ts` files**: Duplicates assertions, risks drift between mocked and live variants
- **Single describe block with conditional model**: Obscures intent; harder to see which tests ran in which mode
- **Always run live (fail when no key)**: Blocks CI/local runs without API key — rejected for developer experience
