# Product Spec Index: Catalog Content Optimizer

> Status: DRAFT | Created: 2026-04-05 | Last updated: 2026-04-05
> Feature slug: `catalog-content-optimizer`
> [Back to Feature Root](../README.md) | [Research](../research/README.md)

## What We're Building

An AI-powered catalog management tool that lets operators bulk-generate
optimized product/category descriptions and SEO metadata via conversational
chat, with real-time per-item progress streaming, editable side-by-side
review, and human-in-the-loop approval before saving.

## Document Map

| Document | Purpose | Detail Level | Status |
|----------|---------|--------------|--------|
| [product-spec.md](./product-spec.md) | Main PRD — goals, stories, requirements | Standard | DRAFT |
| [user-journey.md](./user-journey.md) | Bulk optimization + reconnection flows | Standard | DRAFT |
| [wireframes/](./wireframes/index.html) | Chat interface, bulk edit table, expanded row | Basic HTML | DRAFT |

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI SDK version | v6 (beta) | Latest features, Output.object() for structured generation |
| Step granularity | Per-item `"use step"` | Retry isolation, observability, crash-safe resume |
| Generation model | Haiku 4.5 (not main agent model) | Cost efficiency, only needs item + brand voice |
| Table rendering | Inline data parts in chat | Simpler than split-pane, leverages AI SDK parts system |
| Test runner | Vitest (unified) | Single runner for all test types |
| Data persistence | In-memory mock | Constitution excludes DB |

## Must Read

> Start with [product-spec.md](./product-spec.md), then review
> [user-journey.md](./user-journey.md) and [wireframes](./wireframes/index.html).
> Research artifacts are in [../research/](../research/README.md).
