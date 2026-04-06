# Research: Catalog Content Optimizer

> Feature: catalog-content-optimizer | Phase: Research
> Date: 2026-04-05

## Executive Summary

This research covers the technical patterns, competitive landscape, and UX best
practices for building an AI-powered e-commerce catalog content optimizer using
Vercel AI SDK, Vercel Workflows (Durable Agents), and Next.js.

The system will enable catalog operators to bulk-generate and optimize product/category
descriptions and SEO metadata using a conversational AI agent with brand voice awareness,
durable long-running workflows, real-time streaming updates, and human-in-the-loop
approval before saving.

## Key Findings

### Architecture (from reference projects)

1. **Durable Agent pattern**: The `DurableAgent` class from `@workflow/ai/agent`
   combined with `"use workflow"` / `"use step"` directives provides automatic
   retries, resumability, and state persistence for long-running AI tasks.

2. **Multi-turn chat**: A `defineHook` + `while(true)` loop pattern allows a
   single workflow run to hold an entire chat session, receiving follow-up
   messages via hook resumption. The `WorkflowChatTransport` replaces
   `DefaultChatTransport` on the client.

3. **Per-item step granularity**: Each product/category MUST be its own
   `"use step"` call for individual retry, observability, and crash-safe
   resume. A single batch step loses all durability benefits. Each step
   emits real-time UI updates via `getWritable()` + custom `"data-*"`
   message parts.

4. **Human-in-the-loop**: Workflow `waitForEvent` or hook patterns pause
   execution until the user approves, with configurable timeouts.

5. **Two-model strategy**: Main agent uses `claude-sonnet-4.6` for orchestration;
   content generation tools invoke `claude-haiku-4.5` with minimal context
   (just current item + brand voice) for cost efficiency.

### Testing Strategy

- **Unit tests**: Steps marked `"use step"` are plain async functions testable
  without workflow runtime.
- **Integration tests**: `@workflow/vitest` plugin provides `waitForHook`,
  `resumeHook`, `waitForSleep` for testing full workflow flows including
  approval gates.
- **AI mocking**: `MockLanguageModelV3` from `ai/test` enables deterministic
  testing of AI responses and tool calls.
- **UI components**: Vitest + React Testing Library for component unit tests.

### AI SDK Version

- Targeting **AI SDK v6** (`ai@6.0.0-beta.*`) — key changes from v5:
  `generateObject`/`streamObject` deprecated in favor of `generateText` +
  `Output.object()`, `ToolLoopAgent` replaces `Experimental_Agent`,
  test mock is `MockLanguageModelV3` from `ai/test`.

## Document Index

| Document | Description |
|----------|-------------|
| [Competitors](./competitors.md) | Competitive landscape analysis |
| [UX Patterns](./ux-patterns.md) | UI/UX best practices for bulk editing |
| [Codebase Analysis](./codebase-analysis.md) | Integration points in current repo |
| [Tech Stack](./tech-stack.md) | Library recommendations and versions |
