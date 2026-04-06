# Tasks: Catalog Content Optimizer

**Input**: Design documents from `features/catalog-content-optimizer/`
**Prerequisites**: plan.md (required), spec.md (required), research/tech-stack.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and configuration

- [ ] T001 Initialize Next.js project with TypeScript, Tailwind CSS, and App Router in `src/`
- [ ] T002 Install runtime dependencies: `ai@6.x-beta`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `workflow@4.x-beta`, `@workflow/ai@4.x-beta`, `zod`, `@radix-ui/react-collapsible`, `@radix-ui/react-slot`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
- [ ] T003 Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@workflow/vitest`, `@ai-sdk/devtools`, `jsdom`
- [ ] T004 [P] Configure `next.config.ts` with `withWorkflow()` wrapper
- [ ] T005 [P] Configure `vitest.config.ts` with `@workflow/vitest` plugin, jsdom environment for component tests
- [ ] T006 [P] Configure `tsconfig.json` with strict mode, path aliases (`@/` → `src/`)
- [ ] T007 [P] Create `src/lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
- [ ] T008 [P] Setup `@ai-sdk/devtools` middleware in development

**Checkpoint**: Project builds, tests run, workflow plugin active

---

## Phase 2: Foundational — Schemas & Mock Data

**Purpose**: Shared types and mock data that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 [P] Create Zod schemas in `src/lib/schemas/catalog.ts`: CatalogContent, SEOContent, Product, Category, PromotionData
- [ ] T010 [P] Create Zod schema in `src/lib/schemas/brand-voice.ts`: BrandVoice
- [ ] T011 [P] Create custom data part types in `src/lib/schemas/data-parts.ts`: DataProductStatus, DataProductContent, DataCategoryStatus, DataCategoryContent, DataApprovalRequest
- [ ] T012 Write schema validation tests in `src/__tests__/lib/schemas.test.ts`
- [ ] T013 Create mock product data in `src/lib/data/products.ts` (20-30 products across 3-4 categories with realistic names, descriptions, SEO data)
- [ ] T014 [P] Create mock category data in `src/lib/data/categories.ts` (4-5 categories with descriptions)
- [ ] T015 [P] Create mock brand voice data in `src/lib/data/brand-voices.ts` (1-2 brand voice profiles)
- [ ] T016 Create in-memory mutable store in `src/lib/data/store.ts` for save operations (wraps mock data, supports updates)

**Checkpoint**: All schemas validate, mock data loads, store supports CRUD

---

## Phase 3: User Story 1 — Bulk Product Description Generation (P1) MVP

**Goal**: Operator asks AI to generate descriptions for a category → agent fetches products, retrieves brand voice, generates per-item descriptions

**Independent Test**: Send chat message → agent calls tools → descriptions generated for each product

### Tests for User Story 1

- [ ] T017 [P] [US1] Unit test for `get_products` tool in `src/__tests__/workflows/tools/get-products.test.ts`
- [ ] T018 [P] [US1] Unit test for `get_brand_voice` tool in `src/__tests__/workflows/tools/get-brand-voice.test.ts` (Note: get_brand_voice is also used by US4, but test here first)
- [ ] T019 [P] [US1] Unit test for `generate_descriptions` tool in `src/__tests__/workflows/tools/generate-descriptions.test.ts` — mock Haiku responses, verify per-item step calls and emissions

### Implementation for User Story 1

- [ ] T020 [US1] Implement `get_products` tool in `src/workflows/tools/get-products.ts` — `"use step"`, reads from mock data, emits found products count
- [ ] T021 [US1] Implement `get_brand_voice` tool in `src/workflows/tools/get-brand-voice.ts` — `"use step"`, returns brand voice string
- [ ] T022 [US1] Implement `generate_descriptions` tool in `src/workflows/tools/generate-descriptions.ts` — per-item `"use step"` loop, calls Haiku 4.5 with `generateText` + `Output.object({ schema: catalogContentSchema })`, emits status updates via `getWritable()`
- [ ] T023 [US1] Implement main durable agent workflow in `src/workflows/catalog-agent.ts` — `DurableAgent` with Sonnet 4.6, system prompt, tool registration, `defineHook` for multi-turn, `while(true)` loop
- [ ] T024 [US1] Create chat API route `src/app/api/chat/route.ts` — POST handler: `convertToModelMessages`, `start(catalogAgentWorkflow)`, return `createUIMessageStreamResponse`

**Checkpoint**: Agent generates descriptions for products in a category via chat API

---

## Phase 4: User Story 2 — Side-by-Side Review Table (P1)

**Goal**: Bulk edit table renders inline in chat showing current vs. proposed content

**Independent Test**: Table renders with correct columns, rows expand with comparison view

### Tests for User Story 2

- [ ] T025 [P] [US2] Component test for `StatusBadge` in `src/__tests__/components/status-badge.test.tsx`
- [ ] T026 [P] [US2] Component test for `BulkEditRow` in `src/__tests__/components/bulk-edit-row.test.tsx`
- [ ] T027 [P] [US2] Component test for `BulkEditExpanded` in `src/__tests__/components/bulk-edit-expanded.test.tsx`
- [ ] T028 [P] [US2] Component test for `BulkEditTable` in `src/__tests__/components/bulk-edit-table.test.tsx`

### Implementation for User Story 2

- [ ] T029 [P] [US2] Create UI primitives in `src/components/ui/`: badge.tsx, button.tsx, card.tsx, textarea.tsx (Radix + Tailwind)
- [ ] T030 [P] [US2] Create `src/components/ui/collapsible.tsx` wrapping @radix-ui/react-collapsible
- [ ] T031 [US2] Create `src/components/catalog/status-badge.tsx` — Pending (gray), InProgress (blue), Done (green), Failed (red)
- [ ] T032 [US2] Create `src/components/catalog/bulk-edit-row.tsx` — 5-column grid: thumbnail, name, category/catalog, status badge, chevron
- [ ] T033 [US2] Create `src/components/catalog/bulk-edit-expanded.tsx` — 2-column grid: current (read-only div) vs. proposed (editable textarea), supports CatalogContent + SEOContent fields
- [ ] T034 [US2] Create `src/components/catalog/bulk-edit-table.tsx` — Card wrapper, header with icon/title/description/progress, table header row, collapsible rows, footer with approve button. Accepts `entityType` prop for product vs. category labels. Manages local proposed content state.

**Checkpoint**: Table component renders with mock data, rows expand/collapse, textareas are editable

---

## Phase 5: User Story 3 — Human-in-the-Loop Approval (P1)

**Goal**: Approve button triggers save, HITL gate prevents unauthorized saves

**Independent Test**: Approve button enabled only when all Done, save tool executes with approved content

### Tests for User Story 3

- [ ] T035 [P] [US3] Unit test for `save_products` tool in `src/__tests__/workflows/tools/save-products.test.ts`
- [ ] T036 [P] [US3] Integration test for approval flow in `src/__tests__/workflows/approval-flow.integration.test.ts` — uses `waitForHook`/`resumeHook` from @workflow/vitest

### Implementation for User Story 3

- [ ] T037 [US3] Implement `save_products` tool in `src/workflows/tools/save-products.ts` — `"use step"`, writes to in-memory store, requires HITL approval via workflow hook before executing
- [ ] T038 [US3] Wire approval flow: bulk-edit-table "Approve" button sends approval message via chat hook → agent calls save_products with approved content (including user edits from table state)

**Checkpoint**: Full flow works: generate → review → edit → approve → save

---

## Phase 6: User Story 4 — SEO Metadata Generation (P1)

**Goal**: Agent generates metaTitle and metaDescription per product

### Tests for User Story 4

- [ ] T039 [P] [US4] Unit test for `generate_seo_data` tool in `src/__tests__/workflows/tools/generate-seo-data.test.ts`

### Implementation for User Story 4

- [ ] T040 [US4] Implement `generate_seo_data` tool in `src/workflows/tools/generate-seo-data.ts` — per-item `"use step"` loop, calls Haiku 4.5 with `Output.object({ schema: seoContentSchema })`, emits status updates
- [ ] T041 [US4] Update `bulk-edit-expanded.tsx` to render SEO fields (metaTitle, metaDescription) below description fields when SEO data is present

**Checkpoint**: SEO generation works, displayed in expanded rows

---

## Phase 7: User Story 5 — Multi-Turn Conversation (P1)

**Goal**: Follow-up messages refine results within the same workflow

### Tests for User Story 5

- [ ] T042 [US5] Integration test for multi-turn flow in `src/__tests__/workflows/catalog-agent.integration.test.ts` — start workflow, send follow-up via hook, verify agent processes both turns

### Implementation for User Story 5

- [ ] T043 [US5] Create follow-up API route `src/app/api/chat/[id]/route.ts` — POST handler: resume chatMessageHook with follow-up message
- [ ] T044 [US5] Create `src/hooks/use-workflow-chat.ts` — custom hook wrapping `useChat` with `WorkflowChatTransport`, stores workflowRunId, routes follow-ups to `/api/chat/${id}`

**Checkpoint**: User can send follow-up messages that refine results without restarting

---

## Phase 8: User Story 6 — Real-Time Per-Item Progress (P1)

**Goal**: Status badges update in real time as each product is processed

### Implementation for User Story 6

- [ ] T045 [US6] Wire custom data parts from workflow emissions to BulkEditTable component — parse `"data-product-status"` and `"data-product-content"` parts from message stream, update row status and proposed content in real time
- [ ] T046 [US6] Add progress indicator to table header/footer — show "{N} of {M} complete" based on streaming emissions count

**Checkpoint**: Status badges flip Pending → InProgress → Done in real time during generation

---

## Phase 9: User Story 7 — Category Content Optimization (P2)

**Goal**: Same workflow supports category entities

### Tests for User Story 7

- [ ] T047 [P] [US7] Unit test for `get_categories` tool in `src/__tests__/workflows/tools/get-categories.test.ts`
- [ ] T048 [P] [US7] Unit test for `save_categories` tool in `src/__tests__/workflows/tools/save-categories.test.ts` (Note: save_categories also needs HITL approval like save_products)

### Implementation for User Story 7

- [ ] T049 [US7] Implement `get_categories` tool in `src/workflows/tools/get-categories.ts` — `"use step"`, reads from mock data
- [ ] T050 [US7] Implement `save_categories` tool in `src/workflows/tools/save-categories.ts` — `"use step"`, HITL approval, writes to store
- [ ] T051 [US7] Verify BulkEditTable renders correctly with category data (entityType="category" switches column label to "Catalog")

**Checkpoint**: Category optimization works end-to-end

---

## Phase 10: User Story 8 — Workflow Reconnection (P2)

**Goal**: User can reconnect to a running workflow after disconnect

### Implementation for User Story 8

- [ ] T052 [US8] Create stream reconnection API route `src/app/api/chat/[id]/stream/route.ts` — GET handler: reconnect to existing workflow run readable stream from startIndex
- [ ] T053 [US8] Update `use-workflow-chat.ts` to persist workflowRunId to localStorage, attempt reconnection on page load if ID exists

**Checkpoint**: Page refresh reconnects to running workflow, shows current state

---

## Phase 11: Chat Interface & Main Page

**Purpose**: Wire everything together into the main UI

### Tests

- [ ] T054 [P] Component test for ChatInterface in `src/__tests__/components/chat-interface.test.tsx`

### Implementation

- [ ] T055 Create `src/components/chat/chat-message.tsx` — renders message parts: text, tool-call status, custom data parts (bulk-edit-table)
- [ ] T056 Create `src/components/chat/chat-input.tsx` — input field + send button, disabled when status !== 'ready'
- [ ] T057 Create `src/components/chat/chat-interface.tsx` — message list + input, uses `useWorkflowChat` hook, renders BulkEditTable for `"data-product-content"` / `"data-category-content"` parts
- [ ] T058 Create `src/app/page.tsx` — main page rendering ChatInterface
- [ ] T059 Create `src/app/layout.tsx` — root layout with metadata, Tailwind globals

**Checkpoint**: Full application works end-to-end in browser

---

## Phase 12: Polish & Cross-Cutting

**Purpose**: Error handling, final integration, cleanup

- [ ] T060 Add error handling to all workflow tools — structured error responses, retry configuration (`maxRetries = 2` on generation steps)
- [ ] T061 Add loading/error/empty states to BulkEditTable — empty state when no products found, error state for failed items
- [ ] T062 Add agent system prompt refinement — clear instructions for tool selection based on user intent, brand voice usage, approval flow explanation
- [ ] T063 Run full test suite, fix any failures
- [ ] T064 Verify all acceptance criteria from spec.md are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — core generation flow
- **US2 (Phase 4)**: Depends on Phase 2 — can run parallel to US1
- **US3 (Phase 5)**: Depends on US1 + US2 — approval needs both generation and table
- **US4 (Phase 6)**: Depends on US1 — extends generation with SEO
- **US5 (Phase 7)**: Depends on US1 — adds multi-turn to existing workflow
- **US6 (Phase 8)**: Depends on US1 + US2 — wires streaming to table
- **US7 (Phase 9)**: Depends on US1 + US2 — extends to categories
- **US8 (Phase 10)**: Depends on US5 — reconnection needs multi-turn routing
- **Chat UI (Phase 11)**: Depends on all US phases — integrates everything
- **Polish (Phase 12)**: Depends on Phase 11

### Parallel Opportunities

- T004, T005, T006, T007, T008 can run in parallel (Phase 1 config)
- T009, T010, T011 can run in parallel (Phase 2 schemas)
- T013, T014, T015 can run in parallel (Phase 2 mock data)
- US1 implementation and US2 implementation can run in parallel after Phase 2
- All test tasks marked [P] within a phase can run in parallel

### Implementation Strategy: MVP First

1. Phase 1 + 2: Setup + Foundation
2. Phase 3: US1 (generation) — **validate core AI flow works**
3. Phase 4: US2 (table) — **validate UI renders**
4. Phase 5: US3 (approval) — **validate HITL gate** → **MVP complete**
5. Phases 6-10: Remaining stories incrementally
6. Phase 11-12: Integration + polish
