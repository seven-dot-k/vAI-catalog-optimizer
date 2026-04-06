# Implementation Plan: Catalog Content Optimizer

**Branch**: `catalog-content-optimizer` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `features/catalog-content-optimizer/spec.md`

## Summary

Build an AI-powered catalog content optimizer using Next.js, Vercel AI
SDK v6, and Vercel Workflows (Durable Agents). The system enables bulk
product/category description and SEO metadata generation via a
conversational chat interface with per-item durable steps, real-time
streaming progress, and human-in-the-loop approval before saving.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 15+, ai@6.x-beta, workflow@4.x-beta,
@workflow/ai@4.x-beta, @ai-sdk/anthropic@3.x, Zod 3.x/4.x
**Storage**: In-memory mock data (JSON fixtures), no database
**Testing**: Vitest (unit + integration + component), @workflow/vitest,
@testing-library/react, MockLanguageModelV3 from ai/test
**Target Platform**: Local development (next dev), single process
**Project Type**: Web application (Next.js App Router)
**Constraints**: No auth, no DB, no scaling, no CI/CD per constitution

## Constitution Check

*GATE: Must pass before implementation.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC-First Simplicity | ✅ | In-memory data, no abstractions beyond needed |
| II. AI-Native Architecture | ✅ | All AI through AI SDK v6 + Workflows DurableAgent |
| III. Test-Driven Quality | ✅ | Vitest for all tests, MockLanguageModelV3 for AI |
| IV. Type Safety | ✅ | Strict TS, Zod schemas, shared types |
| V. Component-Driven UI | ✅ | Server Components default, AI SDK hooks for client |
| VI. Explicit Error Boundaries | ✅ | Per-step retry, structured errors, UI error states |

## Project Structure

### Documentation (this feature)

```text
features/catalog-content-optimizer/
├── plan.md              # This file
├── spec.md              # SpecKit specification
├── tasks.md             # Task breakdown
├── review.md            # Revalidation log
├── research/            # Phase 1 research artifacts
└── product-spec/        # Phase 2 product spec artifacts
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                        # Main page — chat interface
│   ├── layout.tsx                      # Root layout with metadata
│   ├── globals.css                     # Tailwind imports
│   └── api/
│       └── chat/
│           ├── route.ts                # POST: start workflow session
│           └── [id]/
│               ├── route.ts            # POST: follow-up messages
│               └── stream/
│                   └── route.ts        # GET: stream reconnection
├── components/
│   ├── ui/                             # Reusable Radix-based primitives
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── collapsible.tsx
│   │   └── textarea.tsx
│   ├── chat/
│   │   ├── chat-interface.tsx          # Main chat component
│   │   ├── chat-message.tsx            # Individual message renderer
│   │   └── chat-input.tsx              # Input area with send button
│   └── catalog/
│       ├── bulk-edit-table.tsx          # Reusable expandable table
│       ├── bulk-edit-row.tsx            # Collapsed row component
│       ├── bulk-edit-expanded.tsx       # Expanded comparison view
│       └── status-badge.tsx            # Pending/InProgress/Done badge
├── lib/
│   ├── data/
│   │   ├── products.ts                 # Mock product data + accessor
│   │   ├── categories.ts              # Mock category data + accessor
│   │   ├── brand-voices.ts            # Mock brand voice data
│   │   └── store.ts                    # In-memory mutable store for saves
│   ├── schemas/
│   │   ├── catalog.ts                  # CatalogContent, SEOContent, Product, Category Zod schemas
│   │   ├── brand-voice.ts             # BrandVoice schema
│   │   └── data-parts.ts              # Custom data part type definitions
│   └── utils.ts                        # cn() helper
├── workflows/
│   ├── catalog-agent.ts                # Main durable agent workflow + multi-turn hook
│   └── tools/
│       ├── get-products.ts             # Fetch products (single step)
│       ├── get-categories.ts           # Fetch categories (single step)
│       ├── get-brand-voice.ts          # Retrieve brand voice (single step)
│       ├── generate-descriptions.ts    # Per-item step loop with Haiku
│       ├── generate-seo-data.ts        # Per-item step loop with Haiku
│       ├── save-products.ts            # Save with HITL approval
│       └── save-categories.ts          # Save with HITL approval
├── hooks/
│   └── use-workflow-chat.ts            # WorkflowChatTransport wrapper
└── __tests__/
    ├── components/
    │   ├── bulk-edit-table.test.tsx
    │   ├── bulk-edit-row.test.tsx
    │   ├── bulk-edit-expanded.test.tsx
    │   ├── status-badge.test.tsx
    │   └── chat-interface.test.tsx
    ├── workflows/
    │   ├── catalog-agent.integration.test.ts
    │   ├── tools/
    │   │   ├── get-products.test.ts
    │   │   ├── get-categories.test.ts
    │   │   ├── generate-descriptions.test.ts
    │   │   ├── generate-seo-data.test.ts
    │   │   ├── save-products.test.ts
    │   │   └── save-categories.test.ts
    │   └── approval-flow.integration.test.ts
    └── lib/
        └── schemas.test.ts
```

**Structure Decision**: Single Next.js project with `src/` directory.
Workflows in `src/workflows/`, components in `src/components/`, mock
data in `src/lib/data/`. Tests colocated under `src/__tests__/` mirroring
source structure.

## Complexity Tracking

No constitution violations. All choices align with POC-First Simplicity.
