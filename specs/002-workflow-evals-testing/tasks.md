# Tasks: Workflow Evals & Testing for Product Content Optimization

**Input**: Design documents from `/specs/001-workflow-evals-testing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: This feature IS the test suite. All tasks produce test files.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create eval directory structure and shared helper modules

- [X] T001 Create eval directory structure at `src/__tests__/evals/helpers/`
- [X] T002 [P] Create mock model factory using `MockLanguageModelV3` and `simulateReadableStream` from `ai/test` in `src/__tests__/evals/helpers/mock-model.ts` — export a `createMockModel(steps: MockStreamStep[])` function that accepts an array of step configs (each with optional `toolCalls` array and/or `textResponse`) and returns a `MockLanguageModelV3` with `doStream` set to `mockValues(...)` over the corresponding `LanguageModelV3StreamResult` values. Each tool-call step must emit `stream-start`, `tool-input-start`, `tool-input-delta` (stringified args), `tool-input-end`, `tool-call` (stringified input), and `finish` (finishReason: `tool-calls`). Each text step must emit `stream-start`, `text-start`, `text-delta`, `text-end`, and `finish` (finishReason: `stop`).
- [X] T003 [P] Create mock tool responses fixture module in `src/__tests__/evals/helpers/mock-tool-responses.ts` — export a `createMockTools()` function that returns cloned versions of all 5 product-related tool definitions (`get_products`, `get_brand_voice`, `generate_descriptions`, `generate_seo_data`, `save_products`) with each `execute` replaced by `vi.fn().mockResolvedValue(fixture)`. Fixture data: `get_products` returns 6 electronics products (ELEC-001 through ELEC-006) with realistic `name`, `sku`, `category`, `content`, and `seoContent` fields; `get_brand_voice` returns `{ voice: "Friendly, professional, tech-savvy...", message: "Brand voice retrieved successfully" }`; `generate_descriptions` returns `{ results: [...], message: "Generated descriptions for 6/6 products" }`; `generate_seo_data` returns `{ results: [...], message: "Generated SEO data for 6/6 products" }`; `save_products` returns `{ saved: 6, message: "Successfully saved updates for 6 products" }`. Also export a `createNoopWritable()` function that returns a `new WritableStream<UIMessageChunk>({ write() {} })` for satisfying the `DurableAgent.stream()` `writable` parameter. Also export a constant `EVAL_LIVE_MODEL = "anthropic/claude-haiku-4-5"` for use in live eval describe blocks.

**Checkpoint**: Helper modules ready — eval scenarios can now be written

---

## Phase 2: User Story 1 — Verify Tool Call Sequence for "Optimize Electronics Descriptions" (Priority: P1) MVP

**Goal**: Eval verifies the agent calls `get_products` → `get_brand_voice` → `generate_descriptions` with correct parameters for the "Optimize product descriptions for electronics" prompt.

**Independent Test**: Run `npx vitest run src/__tests__/evals/optimize-descriptions.eval.test.ts`

- [X] T004 [US1] Create eval file `src/__tests__/evals/optimize-descriptions.eval.test.ts` with the following test cases using `DurableAgent` with `model: () => Promise.resolve(mockModel)`, `instructions` set to the catalog agent `SYSTEM_PROMPT`, and `tools` from `createMockTools()`:
  - Test: "calls get_products with categoryId electronics" — configure mock model to emit `get_products` tool call with `{ categoryId: "electronics" }`, then `get_brand_voice`, then `generate_descriptions`, then text response. Assert `mockTools.get_products.execute` was called with `expect.objectContaining({ categoryId: "electronics" })`.
  - Test: "calls get_brand_voice before any generation tool" — assert `mockTools.get_brand_voice.execute` was called. Assert `get_brand_voice.execute` mock call order is before `generate_descriptions.execute` mock call order using `vi.fn()` invocation tracking.
  - Test: "calls generate_descriptions with correct parameters" — assert `mockTools.generate_descriptions.execute` was called with first arg matching `expect.objectContaining({ entityType: "product", brandVoice: expect.any(String), items: expect.arrayContaining([expect.objectContaining({ sku: "ELEC-001", name: expect.any(String), content: expect.any(Object), seoContent: expect.any(Object) })]) })`.
  - Test: "does not call save_products without approval" — assert `mockTools.save_products.execute` was NOT called.
  - **Live LLM variant**: Add a second `describe.skipIf(!process.env.EVAL_LIVE_LLM)("live LLM: optimize electronics descriptions", ...)` block that creates a `DurableAgent` with `model: EVAL_LIVE_MODEL` (string), fresh `createMockTools()`, same `SYSTEM_PROMPT`, and user message "Optimize product descriptions for electronics." Assert the same tool call correctness: `get_products` called with `categoryId: "electronics"`, `get_brand_voice` called before generation, `generate_descriptions` called with `entityType: "product"` and items array, `save_products` NOT called. Set `{ timeout: 120_000 }` on the describe block.

**Checkpoint**: P1 eval validates the core description optimization flow

---

## Phase 3: User Story 2 — Verify Save Flow Requires Explicit Approval (Priority: P2)

**Goal**: Two-turn eval verifies `save_products` is only called after explicit user approval in the second turn.

**Independent Test**: Run `npx vitest run src/__tests__/evals/save-approval.eval.test.ts`

- [X] T005 [US2] Create eval file `src/__tests__/evals/save-approval.eval.test.ts` with two-turn test cases. Use `DurableAgent` with mock model and tools. For turn 1, configure mock model to emit `get_products` → `get_brand_voice` → `generate_descriptions` → text response. For turn 2, create a NEW mock model that emits `save_products` tool call → text response, and create a new `DurableAgent` with it (or reuse with updated model). Pass accumulated messages from turn 1 (`result.messages`) plus `{ role: "user", content: "Looks good, save them" }` as the messages for turn 2:
  - Test: "turn 1 does not call save_products" — run turn 1, assert `mockTools.save_products.execute` NOT called.
  - Test: "turn 2 calls save_products after approval" — run turn 2 with follow-up message, assert `mockTools.save_products.execute` was called.
  - Test: "save_products receives correct SKUs" — assert `save_products.execute` was called with first arg matching `expect.objectContaining({ updates: expect.arrayContaining([expect.objectContaining({ sku: expect.stringMatching(/^ELEC-00[1-6]$/) })]) })`. Assert updates array has length 6.
  - Test: "each save update has content or seoContent" — inspect the `updates` argument passed to `save_products.execute` and assert each item has at least one of `content` or `seoContent` defined.
  - **Live LLM variant**: Add a `describe.skipIf(!process.env.EVAL_LIVE_LLM)("live LLM: save approval flow", ...)` block that runs the same two-turn flow with `model: EVAL_LIVE_MODEL`. Turn 1 prompt: "Optimize product descriptions for electronics." Turn 2 prompt: "Looks good, save them." Assert turn 1 does not call `save_products`, turn 2 calls `save_products` with correct SKUs. Set `{ timeout: 120_000 }`.

**Checkpoint**: P2 eval validates the approval-gated save flow

---

## Phase 4: User Story 3 — Verify SEO Optimization Tool Usage (Priority: P3)

**Goal**: Eval verifies the agent calls `generate_seo_data` (not `generate_descriptions`) for an SEO-specific prompt.

**Independent Test**: Run `npx vitest run src/__tests__/evals/seo-optimization.eval.test.ts`

- [X] T006 [US3] Create eval file `src/__tests__/evals/seo-optimization.eval.test.ts` with test cases using `DurableAgent` with mock model configured to emit `get_products` → `get_brand_voice` → `generate_seo_data` → text response:
  - Test: "calls get_products with categoryId electronics" — assert `mockTools.get_products.execute` called with `expect.objectContaining({ categoryId: "electronics" })`.
  - Test: "calls generate_seo_data with entityType product" — assert `mockTools.generate_seo_data.execute` called with first arg matching `expect.objectContaining({ entityType: "product", brandVoice: expect.any(String), items: expect.any(Array) })`.
  - Test: "does not call generate_descriptions" — assert `mockTools.generate_descriptions.execute` NOT called.
  - **Live LLM variant**: Add a `describe.skipIf(!process.env.EVAL_LIVE_LLM)("live LLM: SEO optimization", ...)` block with `model: LIVE_MODEL`, prompt "Generate SEO data for electronics products." Assert `generate_seo_data` called with `entityType: "product"`, `generate_descriptions` NOT called. Set `{ timeout: 120_000 }`.

**Checkpoint**: P3 eval validates SEO-specific tool routing

---

## Phase 5: Edge Cases (Product-Related)

**Goal**: Cover product-specific boundary conditions — empty results, no category filter, combined operations.

**Independent Test**: Run `npx vitest run src/__tests__/evals/edge-cases.eval.test.ts`

- [X] T007 [P] Create eval file `src/__tests__/evals/edge-cases.eval.test.ts` with the following edge case scenarios:
  - Test: "empty category returns no generation calls" — configure `createMockTools()` with `get_products.execute` returning `{ products: [], count: 0, message: "Found 0 products..." }`. Configure mock model to emit `get_products` → text response (no generation tool calls). Assert `generate_descriptions.execute` NOT called and `generate_seo_data.execute` NOT called.
  - Test: "optimize all products omits categoryId" — configure mock model to emit `get_products` with `{}` args (no categoryId) → `get_brand_voice` → `generate_descriptions` → text response. Assert `mockTools.get_products.execute` was called with first arg where `categoryId` is either `undefined` or not present.
  - Test: "combined descriptions and SEO calls both generation tools" — configure mock model to emit `get_products` → `get_brand_voice` → `generate_descriptions` → `generate_seo_data` → text response. Assert both `generate_descriptions.execute` and `generate_seo_data.execute` were called, each with `entityType: "product"`.
  - **Live LLM variant**: Add a `describe.skipIf(!process.env.EVAL_LIVE_LLM)("live LLM: edge cases", ...)` block with `model: EVAL_LIVE_MODEL`. Test "empty category" with prompt "Optimize product descriptions for kitchen appliances" (returns empty products). Test "all products" with prompt "Optimize all product descriptions." Assert `get_products` called without `categoryId`. Set `{ timeout: 120_000 }`.

**Checkpoint**: All edge cases covered — eval suite complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and cleanup across all eval files

- [X] T008 Run full eval suite via `npx vitest run src/__tests__/evals/` and verify all scenarios pass
- [X] T009 Run existing test suite via `npx vitest run` and verify no regressions
- [X] T010 Run TypeScript type check via `npx tsc --noEmit` and fix any type errors in eval files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 (Phase 2)**: Depends on T002 and T003 (helper modules)
- **US2 (Phase 3)**: Depends on T002 and T003 (helper modules); independent of US1
- **US3 (Phase 4)**: Depends on T002 and T003 (helper modules); independent of US1/US2
- **Edge Cases (Phase 5)**: Depends on T002 and T003 (helper modules); independent of US1/US2/US3
- **Polish (Phase 6)**: Depends on all eval files being written (T004–T007)

### Within Each Phase

- T002 and T003 have no mutual dependency — can be written in parallel
- T004, T005, T006, T007 each depend on Phase 1 but are independent of each other

### Parallel Opportunities

```text
# Phase 1: Run in parallel
T002: mock-model.ts
T003: mock-tool-responses.ts

# Phase 2-5: All eval files can be written in parallel after Phase 1
T004: optimize-descriptions.eval.test.ts  (US1)
T005: save-approval.eval.test.ts          (US2)
T006: seo-optimization.eval.test.ts       (US3)
T007: edge-cases.eval.test.ts             (edge cases)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: US1 — optimize-descriptions.eval.ts (T004)
3. **STOP and VALIDATE**: Run `npx vitest run src/__tests__/evals/optimize-descriptions.eval.ts`
4. Core eval is functional — remaining stories add coverage

### Incremental Delivery

1. Setup + US1 → MVP eval for description optimization
2. Add US2 → Save-approval safety net
3. Add US3 → SEO routing coverage
4. Add Edge Cases → Boundary condition coverage
5. Polish → Full suite validation

---

## Notes

- All eval files use `.eval.test.ts` extension to distinguish from unit tests (`.test.ts`) while satisfying Vitest's `*.test.{ts,tsx}` include pattern
- Each eval file has TWO describe blocks: one mocked (deterministic, always runs) and one live LLM (real `anthropic/claude-haiku-4-5`, skipped without `ANTHROPIC_API_KEY`)
- Mock model scripting is deterministic — no LLM API calls during mocked tests
- Live LLM tests use real model reasoning but mocked tool executes — no real data fetches or content generation occur
- Assertions focus on tool call names and parameter shapes, NOT on agent text responses (in both modes)
- Each eval file is independently runnable via `npx vitest run <file>`
- The `SYSTEM_PROMPT` is exported from `src/workflows/catalog-agent.ts` and imported in eval files
