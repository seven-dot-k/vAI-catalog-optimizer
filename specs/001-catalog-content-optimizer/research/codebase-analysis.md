# Codebase Analysis: V-CatalogManager

> Related: [Research Index](./README.md) | [Tech Stack](./tech-stack.md)

## Current State

The project is a fresh repository initialized from the Specify template.
There is no application code, no Next.js project structure, and no
dependencies installed yet.

### Existing Files

```
.specify/          — Specify framework templates and config
.product-forge/    — Product Forge configuration
.claude/           — Claude Code skills
.agents/           — Agent skill definitions
.github/           — GitHub configuration
.vscode/           — VS Code settings
features/          — Product Forge feature artifacts
```

### Constitution Reference

The project constitution (`.specify/memory/constitution.md` v1.0.0) defines:

1. **POC-First Simplicity** — YAGNI, no premature abstractions
2. **AI-Native Architecture** — Vercel AI SDK + Workflows for all AI
3. **Test-Driven Quality** — Tests alongside implementation (NON-NEGOTIABLE)
4. **Type Safety** — Strict TS, Zod schemas, no `any`
5. **Component-Driven UI** — Server Components default, AI SDK hooks
6. **Explicit Error Boundaries** — Structured errors, bounded retries

### Explicit Exclusions (from constitution)

- No authentication/authorization
- No database persistence (in-memory/file-based only)
- No horizontal scaling
- No production hardening
- No CI/CD pipeline

## Integration Points

Since the project is greenfield, all integration points are forward-looking:

### Next.js App Router

- `app/` directory with route handlers for workflow API endpoints
- `app/api/chat/route.ts` — initial chat workflow start
- `app/api/chat/[id]/route.ts` — multi-turn follow-up messages
- `app/api/chat/[id]/stream/route.ts` — stream reconnection

### Workflow Files

- `workflows/catalog-agent.ts` — main durable agent workflow
- `workflows/tools/` — tool definitions with `"use step"` directives

### Data Layer

- In-memory mock data for products, categories, brand voices
- `lib/data/` — mock data files and accessor functions
- No database, ORM, or external data store per constitution

### UI Components

- `components/` — React components for chat and bulk edit table
- Radix UI primitives for collapsible rows, badges, buttons
- Tailwind CSS for styling
- lucide-react for icons

### Testing

- Vitest as test runner (constitution mandates)
- `ai/test` — MockLanguageModelV3 for AI response mocking
- `@workflow/vitest` — workflow integration testing
- Vitest + React Testing Library for UI component tests

## Risks & Considerations

1. **Vercel Workflows beta**: Package versions are `beta.29` — APIs may
   change. Pin exact versions.
2. **In-memory data**: Mock data resets on server restart. Acceptable for
   POC but worth noting in documentation.
