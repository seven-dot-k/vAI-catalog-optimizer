# Feature Specification: Workflow Evals & Testing for Product Content Optimization

**Feature Branch**: `001-workflow-evals-testing`
**Created**: 2026-04-05
**Status**: Draft
**Input**: User description: "Create a plan to add evals and testing for the product content workflow - Optimize Product descriptions for electronics. Mock all tool call responses, focus on asserting the correct tool call usage with the correct parameters. Do not focus on validating the exact text to user response from the LLM"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify Tool Call Sequence for "Optimize Electronics Descriptions" (Priority: P1)

A developer runs the eval suite against the prompt "Optimize product descriptions for electronics." The test sends this user message to the catalog agent with all tool responses mocked. The eval verifies the agent calls the correct tools in the expected order with the correct parameters — without making any real LLM calls for tool execution.

**Why this priority**: This is the core eval scenario directly matching the user request. It validates the agent's orchestration logic end-to-end for the most common workflow — fetching electronics products, retrieving brand voice, and generating descriptions.

**Independent Test**: Can be fully tested by running a single eval that mocks all tool responses and asserts tool call names, parameter shapes, and ordering. Delivers confidence that the agent correctly orchestrates the product description optimization flow.

**Acceptance Scenarios**:

1. **Given** the agent receives "Optimize product descriptions for electronics," **When** the agent processes the message, **Then** it calls `get_products` with `categoryId: "electronics"` as its first tool call.
2. **Given** `get_products` returns mocked electronics products, **When** the agent continues, **Then** it calls `get_brand_voice` (with no required parameters or an optional `catalog` parameter) before calling any generation tool.
3. **Given** brand voice is retrieved, **When** the agent continues, **Then** it calls `generate_descriptions` with `entityType: "product"`, a `brandVoice` string, and an `items` array containing all 6 electronics products with their `name`, `sku`, `category`, `content`, and `seoContent` fields.
4. **Given** descriptions are generated, **When** the agent responds, **Then** it does NOT call `save_products` (no explicit user approval was given).

---

### User Story 2 - Verify Save Flow Requires Explicit Approval (Priority: P2)

A developer runs an eval for the two-turn conversation: first "Optimize product descriptions for electronics," then "Looks good, save them." The eval verifies that `save_products` is only called in the second turn after explicit user approval, and that the save payload contains the correct product SKUs.

**Why this priority**: Validates the critical safety constraint that saves never happen without explicit user approval, preventing accidental data overwrites.

**Independent Test**: Can be tested by running a two-turn eval — first turn generates content (asserts no save), second turn provides approval (asserts `save_products` called with correct SKUs).

**Acceptance Scenarios**:

1. **Given** the first turn generates descriptions successfully, **When** the agent completes the first turn, **Then** `save_products` is NOT among the tools called.
2. **Given** the user sends "Looks good, save them" as a follow-up, **When** the agent processes the second turn, **Then** it calls `save_products` with an `updates` array containing SKUs matching the electronics products (ELEC-001 through ELEC-006).
3. **Given** `save_products` is called, **When** the updates payload is inspected, **Then** each update contains a `sku` field and at least one of `content` or `seoContent`.

---

### User Story 3 - Verify SEO Optimization Tool Usage (Priority: P3)

A developer runs an eval for the prompt "Generate SEO data for electronics products." The eval verifies the agent calls `get_products`, `get_brand_voice`, and then `generate_seo_data` (not `generate_descriptions`) with the correct entity type and items.

**Why this priority**: Validates that the agent distinguishes between description generation and SEO generation requests, calling the appropriate tool for each.

**Independent Test**: Can be tested by running a single eval with the SEO-specific prompt and asserting `generate_seo_data` is called instead of `generate_descriptions`.

**Acceptance Scenarios**:

1. **Given** the agent receives "Generate SEO data for electronics products," **When** the agent processes the message, **Then** it calls `get_products` with `categoryId: "electronics"`.
2. **Given** products and brand voice are retrieved, **When** the agent continues, **Then** it calls `generate_seo_data` with `entityType: "product"` and the electronics items array.
3. **Given** the agent processes the SEO request, **When** all tool calls are inspected, **Then** `generate_descriptions` was NOT called.

---

### Edge Cases

- What happens when `get_products` returns an empty array (e.g., for a non-existent category)? The agent should inform the user — no generation tools should be called.
- What happens when the user asks to "optimize all products" without specifying a category? The agent should call `get_products` without a `categoryId` parameter.
- What happens when the user asks for both descriptions and SEO in a single message? The agent should call both `generate_descriptions` and `generate_seo_data`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Eval suite MUST mock all tool `execute` functions so no real data fetches or LLM generation calls occur during tests.
- **FR-002**: Eval suite MUST assert that the agent calls tools in the expected order for the "optimize electronics descriptions" scenario: `get_products` → `get_brand_voice` → `generate_descriptions`.
- **FR-003**: Eval suite MUST validate tool call parameters match expected shapes — `get_products` receives `categoryId: "electronics"`, `generate_descriptions` receives `entityType: "product"` with a populated `items` array and `brandVoice` string.
- **FR-004**: Eval suite MUST verify `save_products` is never called without an explicit approval message in the conversation history.
- **FR-005**: Eval suite MUST support multi-turn conversation testing to validate the approve-and-save flow.
- **FR-006**: Eval suite MUST NOT assert on the exact text content of the agent's natural language responses — only tool call correctness matters.
- **FR-007**: Eval suite MUST use the existing Vitest test runner and project test configuration.
- **FR-008**: Each eval scenario MUST be independently runnable and not depend on other test state.
- **FR-009**: Each eval file MUST include a live LLM variant (using `anthropic/claude-haiku-4-5`) that performs real model reasoning with mocked tool executes. Live variants MUST be skipped when `EVAL_LIVE_LLM` and `AI_GATEWAY_API_KEY` are not set. Live variants assert the same tool call correctness as the mocked variants.

### Key Entities

- **Eval Scenario**: A single test case comprising a user prompt, mocked tool responses, and assertions on tool call names/parameters/ordering.
- **Mock Tool Response**: A predefined return value for a tool execute function, using realistic data shapes matching the existing product schemas.
- **Tool Call Assertion**: A check on the tool name, input parameters, and call ordering emitted by the agent during a scenario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All eval scenarios pass when the agent correctly orchestrates the "optimize electronics descriptions" workflow with proper tool ordering and parameters.
- **SC-002**: An eval scenario fails if the agent skips `get_brand_voice` before calling a generation tool.
- **SC-003**: An eval scenario fails if `save_products` is called without a prior approval message in the conversation.
- **SC-004**: Mocked eval scenarios run in under 60 seconds combined. Live LLM eval scenarios are permitted longer run times (model latency) but have a 120-second timeout per scenario.
- **SC-005**: Eval suite achieves coverage of the product-related catalog tools (`get_products`, `get_brand_voice`, `generate_descriptions`, `generate_seo_data`, `save_products`) for parameter validation (each tool's expected parameter shape is asserted in at least one scenario).

## Assumptions

- The existing Vitest + jsdom test configuration is used as-is for running evals.
- The catalog agent's system prompt and tool definitions remain stable during eval development.
- Tool call mocking intercepts the `execute` function on each tool definition; the agent's LLM reasoning layer is either mocked (deterministic tests) or live (`anthropic/claude-haiku-4-5` for live evals) to determine which tools to call.
- Live LLM evals use the same mocked tool execute functions — only the model reasoning is real; no actual data fetches or content generation occur.
- Live evals are gated by `ANTHROPIC_API_KEY` environment variable and auto-skip when absent.
- The existing mock product data (6 electronics products: ELEC-001 through ELEC-006) is used as the baseline for mocked `get_products` responses.
- Multi-turn eval scenarios simulate follow-up messages by appending to the conversation message array, not through the actual hook/webhook mechanism.
