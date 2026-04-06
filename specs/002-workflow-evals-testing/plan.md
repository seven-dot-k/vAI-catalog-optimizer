# Implementation Plan: Workflow Evals & Testing for Product Content Optimization

**Branch**: `001-workflow-evals-testing` | **Date**: 2026-04-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-workflow-evals-testing/spec.md`

## Summary

Add an eval/test suite for the catalog agent's product content optimization workflow. Tests use `MockLanguageModelV3` from `ai/test` to script deterministic tool-call sequences against the `DurableAgent`, with all tool `execute` functions mocked. Assertions target tool call names, parameter shapes, and ordering — not LLM natural-language responses. Covers the "optimize electronics descriptions" flow (P1), approval-gated save flow (P2), and SEO-specific tool routing (P3), plus product-specific edge cases.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, Next.js 15)
**Primary Dependencies**: `ai@^6.0.146` (AI SDK), `@workflow/ai@^4.1.0-beta.60` (DurableAgent), `zod@^3.24`
**Storage**: N/A (in-memory mock data)
**Testing**: Vitest 3.2.4 with jsdom environment, `ai/test` for `MockLanguageModelV3` / `simulateReadableStream` / `mockValues`, `ai` gateway for live `anthropic/claude-haiku-4-5` calls
**Target Platform**: Node.js (test runner)
**Project Type**: Web application (Next.js) — test suite only
**Performance Goals**: Mocked eval scenarios complete in under 60 seconds combined; live LLM scenarios have 120-second per-test timeout
**Constraints**: Tool execute functions always mocked; model reasoning is either mocked (deterministic) or live (real LLM). Live evals gated by `ANTHROPIC_API_KEY`
**Scale/Scope**: 5-7 eval scenarios covering 5 product-related tools, each with mocked + live variants

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC-First Simplicity | PASS | Eval suite adds minimum test infrastructure; no abstractions beyond what scenarios require |
| II. AI-Native Architecture | PASS | Uses AI SDK's own `ai/test` mock utilities; evaluates `DurableAgent` directly |
| III. Test-Driven Quality (NON-NEGOTIABLE) | PASS | This feature IS the test suite; directly satisfies the constitution's testing mandate |
| IV. Type Safety as Documentation | PASS | Mock data uses existing Zod schemas (`Product`, `CatalogContent`, `SEOContent`); tool input types preserved |
| V. Component-Driven UI | N/A | No UI changes |
| VI. Explicit Error Boundaries | PASS | Edge case scenarios test empty-result handling |

## Project Structure

### Documentation (this feature)

```text
specs/001-workflow-evals-testing/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── __tests__/
│   ├── setup.ts                          # Existing test setup
│   ├── evals/
│   │   ├── helpers/
│   │   │   ├── mock-model.ts             # MockLanguageModelV3 factory with tool-call scripting
│   │   │   └── mock-tool-responses.ts    # Predefined tool response fixtures
│   │   ├── optimize-descriptions.eval.test.ts # P1: Tool sequence for electronics optimization
│   │   ├── save-approval.eval.test.ts         # P2: Two-turn approve-and-save flow
│   │   ├── seo-optimization.eval.test.ts      # P3: SEO-specific tool routing
│   │   └── edge-cases.eval.test.ts            # Edge cases: empty results, all products, combined ops
│   └── workflows/
│       └── tools/                        # Existing unit tests (unchanged)
└── workflows/
    ├── catalog-agent.ts                  # Existing agent (unchanged)
    └── tools/                            # Existing tool defs (unchanged)
```

**Structure Decision**: Eval tests live under `src/__tests__/evals/` to separate them from existing unit tests while sharing the same Vitest configuration. Helper modules co-locate mock factories with the evals that use them.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
