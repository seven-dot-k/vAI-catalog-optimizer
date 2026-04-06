# Product Spec: Catalog Content Optimizer

> Status: DRAFT | Version: 1.0 | Date: 2026-04-05
> Feature: `catalog-content-optimizer` | Size: Medium
>
> **Related documents:** [User Journey](./user-journey.md) | [Wireframes](./wireframes/) | [Research](../research/README.md)

## 1. Overview

### Problem Statement

E-commerce catalog operators manage hundreds to thousands of products
and categories, each needing compelling descriptions and SEO metadata.
Writing and maintaining this content manually is slow, inconsistent,
and fails to adhere to a unified brand voice. Existing AI tools
(Jasper, Copy.ai, Shopify Magic) only handle single items at a time
and lack approval workflows.

### Solution Summary

An AI-powered catalog management tool that lets operators describe
what they need in natural language (via chat), then bulk-generates
optimized product/category descriptions and SEO data using a
configurable brand voice. The system uses Vercel Durable Agents for
long-running generation tasks, streams per-item progress in real time,
and requires explicit human approval before saving any changes.

### Background & Research

Key findings from research phase:
- **Competitors:** No existing tool combines bulk operations +
  conversational interface + durable workflows + HITL approval
- **UX/UI:** Chat + canvas pattern with expandable row table for
  current vs. proposed comparison is the standard for catalog tools
- **Technical:** Vercel Workflows provide per-item step durability
  (retry, observability, crash-safe resume); AI SDK v6 supports
  structured output via `Output.object()`

> Full research available in [research/README.md](../research/README.md)

## 2. Users & Personas

### Primary Persona

**Name:** Catalog Operator (Casey)
**Role:** E-commerce merchandiser or catalog manager
**Context:** Manages product listings for an online store. Regularly
needs to update descriptions for new products, seasonal refreshes,
or brand voice changes. Works with batches of 10-200+ products.
**Goals:** Generate high-quality, brand-consistent descriptions and
SEO data quickly across many products without manual writing.
**Frustrations:** Manually writing repetitive content; inconsistent
tone across products; no way to preview changes before they go live.

## 3. User Stories

### Must Have (MVP)

- [ ] **US-001**: As a catalog operator, I want to ask the AI to
  generate descriptions for products in a category so that I can
  update content in bulk.
  **AC:** Given products exist in a category, when I ask "optimize
  descriptions for electronics", then the agent fetches products,
  retrieves brand voice, and generates new descriptions for each
  product individually.

- [ ] **US-002**: As a catalog operator, I want to see a side-by-side
  table of current vs. proposed content so that I can review changes
  before approving.
  **AC:** Given the agent has generated content, then a bulk edit
  table appears in the chat showing each product with expandable
  rows comparing current and proposed descriptions.

- [ ] **US-003**: As a catalog operator, I want to approve or edit
  proposed content before it is saved so that I maintain control
  over what gets published.
  **AC:** Given all items in the table have status "Done", then an
  "Approve" button appears. I can edit proposed text before
  approving. After approval, the agent saves the changes.

- [ ] **US-004**: As a catalog operator, I want the AI to generate
  SEO metadata (meta title, meta description) for products so that
  I can improve search rankings.
  **AC:** Given I ask for SEO optimization, then the agent generates
  metaTitle and metaDescription for each product using the brand
  voice, displayed in the bulk edit table.

- [ ] **US-005**: As a catalog operator, I want to send follow-up
  messages to refine results so that I can adjust tone or scope
  without restarting.
  **AC:** Given content has been generated, when I send "make these
  more casual" or "also do the accessories category", then the
  agent processes the follow-up within the same session.

- [ ] **US-006**: As a catalog operator, I want to see real-time
  progress as each product is processed so that I know the system
  is working and can estimate completion time.
  **AC:** Given a bulk generation is running, then each row in the
  table shows status: Pending → InProgress → Done, updating in
  real time as each item completes.

### Should Have

- [ ] **US-007**: As a catalog operator, I want to optimize category
  descriptions (not just products) so that category pages also have
  good content and SEO.
  **AC:** Given I ask to optimize a category, then the agent fetches
  category data and generates descriptions/SEO using the same
  workflow as products.

- [ ] **US-008**: As a catalog operator, I want the workflow to
  survive page refreshes and network interruptions so that I don't
  lose progress on large batches.
  **AC:** Given a workflow is running and I refresh the page, then
  I can reconnect to the same workflow via its unique URL and see
  current progress.

### Could Have (Future)

- [ ] **US-009**: As a catalog operator, I want to compare multiple
  brand voice variations side by side.
- [ ] **US-010**: As a catalog operator, I want to schedule recurring
  content optimization for new products.

## 4. Feature Breakdown

### 4A. Chat Interface

**Description:** Standard conversational UI using Vercel AI SDK's
`useChat` hook with `WorkflowChatTransport` for multi-turn
workflow integration.

**Key interactions:**
- User types natural language instructions
- AI responds with text + tool call results
- Custom data parts render inline (bulk edit table)
- Follow-up messages resume the workflow via hook

**Edge cases:**
- Empty message submission (prevent)
- Network disconnect mid-stream (reconnect via workflow URL)
- Very long AI responses (scrollable chat area)

### 4B. Bulk Edit Table (Data Part)

**Description:** Reusable expandable table rendered as a custom
`"data-*"` message part within the chat. Supports both products
and categories via `entityType` differentiation.

**Key interactions:**
- Collapsed row: thumbnail, name, category/catalog, status badge,
  expand chevron
- Expanded row: 2-column grid with current (read-only) on left,
  proposed (editable textarea) on right
- Status badges update in real time via streaming emissions
- Footer "Approve" button appears when all items are Done

**Edge cases:**
- 0 products returned (show empty state message)
- Item generation fails (show error badge, allow retry via chat)
- User edits proposed text (local state, submitted on approve)
- Very long descriptions (scrollable textareas)

### 4C. Durable Agent Workflow

**Description:** Single `DurableAgent` workflow using `defineHook`
for multi-turn chat. Main agent (Sonnet 4.6) orchestrates tool
calls. Content generation tools use per-item `"use step"` with
Haiku 4.5 for cost efficiency.

**Key interactions:**
- Workflow starts on first message
- Agent selects tools based on user intent
- Each product processed as individual durable step
- Human-in-the-loop approval before save tools execute
- Follow-up messages resume via hook

**Edge cases:**
- Workflow timeout (configurable, default 30 min)
- Individual step failure (auto-retry up to 2 times)
- All retries exhausted (mark item as failed, continue others)
- User approves partial results (only save Done items)

### 4D. Tool Definitions

| Tool | Purpose | Model | Step Pattern |
|------|---------|-------|-------------|
| `get_products` | Fetch products by category | N/A (data) | Single step |
| `get_categories` | Fetch categories by IDs | N/A (data) | Single step |
| `get_brand_voice` | Retrieve brand voice config | N/A (data) | Single step |
| `generate_descriptions` | Generate content per item | Haiku 4.5 | Per-item step |
| `generate_seo_data` | Generate SEO per item | Haiku 4.5 | Per-item step |
| `save_products` | Persist approved products | N/A (data) | HITL approval |
| `save_categories` | Persist approved categories | N/A (data) | HITL approval |

### 4E. Data Layer (Mock)

**Description:** In-memory mock data for products, categories,
promotions, and brand voices. File-based JSON fixtures loaded
at startup. No database per constitution exclusions.

## 5. Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | System MUST stream AI responses in real time | Must | Via workflow writable |
| FR-002 | System MUST process each item as an individual durable step | Must | For retry/observability |
| FR-003 | System MUST emit per-item status updates during generation | Must | Custom data parts |
| FR-004 | System MUST require human approval before saving changes | Must | HITL via workflow hook |
| FR-005 | System MUST support multi-turn chat within a single workflow | Must | defineHook pattern |
| FR-006 | System MUST use brand voice for all content generation | Must | Retrieved via tool |
| FR-007 | System MUST use Haiku 4.5 for content generation (not main model) | Must | Cost efficiency |
| FR-008 | System MUST allow editing proposed content before approval | Must | Client-side state |
| FR-009 | System MUST support both product and category content types | Should | Reusable table component |
| FR-010 | System MUST support workflow reconnection after disconnect | Should | Stream reconnection endpoint |

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Per-item generation MUST complete in <10s per product |
| Performance | UI MUST remain responsive during bulk generation |
| Reliability | Failed items MUST retry up to 2 times automatically |
| Reliability | Workflow MUST survive server restarts (durable) |
| Testability | All tools MUST be unit-testable as plain functions |
| Testability | Full workflow MUST be integration-testable with mocked AI |

## 7. Out of Scope (v1)

- Authentication and authorization (all endpoints public)
- Database persistence (in-memory only)
- Horizontal scaling (single process)
- Production hardening (no rate limiting, CORS, CSP)
- CI/CD pipeline
- Image/media optimization
- Multi-language content generation
- Content scheduling or publishing workflows
- Analytics and reporting dashboards
- Undo/rollback after save

## 8. Success Criteria

- Operator can generate descriptions for 20+ products in a single
  conversational session
- Per-item streaming progress is visible in the bulk edit table
- Human approval gate works — no data saved without explicit approval
- Follow-up messages refine results without restarting the workflow
- All POC features have passing automated tests

## 9. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Vercel Workflows beta API changes | Medium | High | Pin exact versions, isolate workflow code |
| AI SDK v6 breaking changes | Medium | Medium | Pin versions, use codemod for migration |
| LLM rate limits on bulk generation | Medium | Medium | Sequential per-item steps with backoff |
| Haiku output quality insufficient | Low | Medium | Allow model override in config |
| Mock data doesn't represent real catalog complexity | Low | Low | Use realistic fixture data |

## 10. Open Questions

- Should the bulk edit table support column reordering or sorting?
  **Decision: No for POC — static column order.**
- Should failed items block the "Approve" button?
  **Decision: No — allow approving successful items only.**
- What is the maximum batch size before we should paginate?
  **Decision: Defer — test with 50 items, assess UX.**

## 11. Decision Log

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| AI SDK version | v6 (beta) | Latest features, structured output via Output.object() | 2026-04-05 |
| Step granularity | Per-item steps | Retry isolation, observability, crash-safe resume | 2026-04-05 |
| Content generation model | Haiku 4.5 | Cost efficiency, no chat history needed per item | 2026-04-05 |
| Test runner | Vitest (unified) | Single runner for unit, integration, and component tests | 2026-04-05 |
| Data layer | In-memory mock | Constitution excludes DB persistence | 2026-04-05 |
| UI rendering | Inline data parts in chat | Simpler than split-pane, leverages AI SDK parts system | 2026-04-05 |
