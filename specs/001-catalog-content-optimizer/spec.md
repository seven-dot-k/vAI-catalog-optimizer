# Feature Specification: Catalog Content Optimizer

**Feature Branch**: `catalog-content-optimizer`
**Created**: 2026-04-05
**Status**: Draft
**Input**: AI-powered e-commerce catalog content optimization with bulk generation, brand voice, durable workflows, and human-in-the-loop approval

> **Product Forge Feature** | Generated: 2026-04-05
> Feature slug: `catalog-content-optimizer` | SpecKit mode: classic
>
> **Source artifacts:**
> - Product Spec: [product-spec/README.md](./product-spec/README.md)
> - Research: [research/README.md](./research/README.md)
> - Review log: [review.md](./review.md)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Bulk Product Description Generation (Priority: P1)

As a catalog operator, I want to ask the AI to generate optimized
descriptions for all products in a category so that I can update
content in bulk without manual writing.

**Why this priority**: Core value proposition — this is the primary
use case that validates the entire POC.

**Independent Test**: Can be fully tested by sending a chat message
requesting category optimization and verifying that descriptions
are generated for each product with brand voice applied.

**Acceptance Scenarios**:

1. **Given** products exist in a category, **When** I type "optimize
   descriptions for electronics", **Then** the agent calls
   `get_products` with category filter, `get_brand_voice`, and
   `generate_descriptions` for each product as individual durable
   steps.
2. **Given** the agent is generating content, **When** each product
   completes, **Then** its status in the bulk edit table updates from
   Pending → InProgress → Done in real time via streaming emissions.
3. **Given** no products exist in the requested category, **When** I
   ask to optimize, **Then** the agent responds with a text message
   explaining no products were found.

---

### User Story 2 — Side-by-Side Review Table (Priority: P1)

As a catalog operator, I want to see a side-by-side table comparing
current vs. proposed content so that I can review AI-generated
changes before they are saved.

**Why this priority**: Without review capability, the generation
feature has no value — operators need to verify content quality.

**Independent Test**: Can be tested by verifying the bulk edit table
renders inline in the chat with correct columns, expandable rows,
and editable proposed content.

**Acceptance Scenarios**:

1. **Given** the agent has generated content for products, **Then** a
   bulk edit table appears as a custom data part in the chat stream
   showing product name, SKU, category, status badge, and expand
   chevron in a 5-column grid.
2. **Given** I click a product row, **Then** it expands to show a
   2-column layout with current descriptions (read-only) on the left
   and proposed descriptions (editable textarea) on the right.
3. **Given** I edit a proposed description textarea, **Then** my
   changes are preserved in local state until I approve or discard.

---

### User Story 3 — Human-in-the-Loop Approval (Priority: P1)

As a catalog operator, I want to explicitly approve changes before
they are saved so that I maintain control over published content.

**Why this priority**: HITL approval is a core differentiator and
non-negotiable for enterprise catalog workflows.

**Independent Test**: Can be tested by verifying the Approve button
only appears when all items are Done, and that clicking it triggers
the save tool with approved content.

**Acceptance Scenarios**:

1. **Given** all products in the table have status "Done", **Then**
   the "Approve Changes" button becomes enabled in the table footer.
2. **Given** some products are still Pending or InProgress, **Then**
   the Approve button is disabled.
3. **Given** I click Approve, **Then** the agent calls `save_products`
   with the approved content (including any user edits) and displays
   a confirmation message in the chat.

---

### User Story 4 — SEO Metadata Generation (Priority: P1)

As a catalog operator, I want the AI to generate SEO metadata (meta
title, meta description) for products so that I can improve search
rankings consistently.

**Why this priority**: SEO is a primary content optimization use case
alongside descriptions.

**Independent Test**: Can be tested by requesting SEO generation and
verifying metaTitle and metaDescription fields appear in the expanded
table rows.

**Acceptance Scenarios**:

1. **Given** I ask "generate SEO data for electronics products",
   **Then** the agent calls `generate_seo_data` for each product,
   producing metaTitle and metaDescription.
2. **Given** SEO data has been generated, **Then** the expanded table
   row shows SEO fields below the description fields with current vs.
   proposed comparison.

---

### User Story 5 — Multi-Turn Conversation (Priority: P1)

As a catalog operator, I want to send follow-up messages to refine
results so that I can adjust tone, scope, or instructions without
restarting the workflow.

**Why this priority**: Iterative refinement is essential for content
quality — operators rarely accept first-pass output.

**Independent Test**: Can be tested by generating content, then
sending a follow-up like "make these more casual" and verifying the
agent re-generates with updated instructions.

**Acceptance Scenarios**:

1. **Given** content has been generated in the current session,
   **When** I type "make these descriptions more casual", **Then**
   the agent processes the follow-up within the same workflow run
   via the multi-turn hook.
2. **Given** I send a follow-up message, **Then** the workflow does
   NOT restart — it continues from the existing state.
3. **Given** I type "also do the accessories category", **Then** the
   agent fetches additional products and generates content for them.

---

### User Story 6 — Real-Time Per-Item Progress (Priority: P1)

As a catalog operator, I want to see real-time progress as each
product is processed so that I know the system is working and can
estimate completion time.

**Why this priority**: Bulk operations without progress feedback feel
broken — operators need visual confirmation of activity.

**Independent Test**: Can be tested by triggering generation for
multiple products and verifying status badges update sequentially
from Pending to InProgress to Done.

**Acceptance Scenarios**:

1. **Given** a bulk generation is in progress, **Then** each product
   row shows its current status: Pending (gray), InProgress (blue),
   or Done (green) badge.
2. **Given** 7 of 12 items are complete, **Then** the table header
   or footer shows progress like "7 of 12 complete".
3. **Given** an item fails after retries, **Then** it shows a
   "Failed" (red) status badge, and other items continue processing.

---

### User Story 7 — Category Content Optimization (Priority: P2)

As a catalog operator, I want to optimize category descriptions (not
just products) so that category landing pages have compelling content
and SEO data.

**Why this priority**: Extends core functionality to categories —
same workflow, different entity type.

**Independent Test**: Can be tested by requesting category optimization
and verifying the table renders with category-specific labels
(Catalog column instead of Category).

**Acceptance Scenarios**:

1. **Given** I ask "optimize the Sports category description",
   **Then** the agent calls `get_categories` and generates content
   using the same workflow as products.
2. **Given** category content is displayed in the table, **Then** the
   third column shows "Catalog" label instead of "Category".

---

### User Story 8 — Workflow Durability & Reconnection (Priority: P2)

As a catalog operator, I want the workflow to survive page refreshes
and network interruptions so that I don't lose progress on large
batches.

**Why this priority**: Large batches (50+ items) take minutes — losing
progress is unacceptable.

**Independent Test**: Can be tested by starting a workflow, simulating
disconnect, then reconnecting via the workflow URL and verifying state
is preserved.

**Acceptance Scenarios**:

1. **Given** a workflow is running with ID `abc123`, **When** I
   navigate to the workflow URL, **Then** the app connects to the
   existing workflow and displays current progress.
2. **Given** a workflow was interrupted, **When** I reconnect, **Then**
   I see all completed items as Done and remaining items at their
   current status.

---

### Edge Cases

- What happens when the LLM returns malformed structured output?
  → Step retries up to 2 times; if all fail, item marked as Failed.
- What happens when the brand voice is not configured?
  → Agent uses a default "professional" voice and notes it in chat.
- What happens when the user approves but some items failed?
  → Only Done items are saved; Failed items are skipped with a note.
- What happens with very large batches (100+ items)?
  → Sequential per-item steps with streaming progress; no pagination
  for POC but defer decision if UX degrades.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST stream AI responses to the client in real
  time via Vercel Workflows writable streams.
- **FR-002**: System MUST process each product/category as an
  individual durable step (`"use step"`) for retry isolation,
  observability, and crash-safe resume.
- **FR-003**: System MUST emit per-item status updates during
  generation via custom `"data-*"` message parts.
- **FR-004**: System MUST require explicit human approval (HITL)
  before executing save operations.
- **FR-005**: System MUST support multi-turn conversation within a
  single workflow run via `defineHook` + resume pattern.
- **FR-006**: System MUST retrieve and apply the configured brand
  voice for all content generation.
- **FR-007**: System MUST use `claude-haiku-4-5` for content
  generation tool calls (not the main agent model) with only
  current item context and brand voice — no chat history.
- **FR-008**: System MUST allow editing proposed content in the
  bulk edit table before approval.
- **FR-009**: System MUST support both product and category entity
  types in the same reusable table component.
- **FR-010**: System MUST support workflow reconnection after
  disconnect via unique workflow URL.

### Key Entities

- **Product**: name, sku, category, content (short/long description),
  seoContent (metaTitle, metaDescription)
- **Category**: name, id, catalog, content (short/long description),
  seoContent (metaTitle, metaDescription)
- **BrandVoice**: catalog identifier, voice description string
- **CatalogContent**: shortDescription, longDescription
- **SEOContent**: metaTitle, metaDescription

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operator can generate descriptions for 20+ products in
  a single conversational session without restarting.
- **SC-002**: Per-item streaming progress is visible in the bulk edit
  table with <2s latency between status updates.
- **SC-003**: Human approval gate works — zero data saved without
  explicit user approval.
- **SC-004**: Follow-up messages refine results within the same
  workflow run (no restart).
- **SC-005**: All POC features have passing automated tests (unit,
  integration, workflow).

## Assumptions

- Single catalog context per session (no multi-catalog switching)
- Mock data with 20-50 products across 3-5 categories is sufficient
  for POC validation
- Brand voice is a simple text string, not a complex configuration
- Network connectivity is generally stable (reconnection is a
  nice-to-have, not the primary flow)
- Vercel Workflows v4 beta API will remain stable for POC duration
