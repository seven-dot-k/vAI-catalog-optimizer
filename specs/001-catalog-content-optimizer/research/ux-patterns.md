# UX Patterns: Bulk Catalog Editing with AI

> Related: [Research Index](./README.md) | [Competitors](./competitors.md)

## Core UX Pattern: Chat + Canvas

The dominant pattern for AI-assisted content tools combines:
1. **Chat panel** — conversational interface for issuing instructions
2. **Canvas/workspace** — structured display of results (table, cards, editor)

This "chat + canvas" layout lets the operator describe what they want in
natural language while seeing structured results update in real time.

## Bulk Edit Table Patterns

### Expandable Row Table

The most effective pattern for bulk catalog editing:

- **Collapsed state**: Summary grid showing key identifiers (name, SKU,
  category) plus a status indicator per row
- **Expanded state**: Side-by-side comparison with current (read-only) on
  left and proposed (editable) on right
- **Status flow**: Pending → InProgress → Done per row
- **Batch actions**: Table-level approve/reject at bottom

### Key UX Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Row expansion | Single or multi | Allow multiple rows open for comparison |
| Edit mode | Inline textarea | No modal dialogs for bulk workflows |
| Save granularity | Table-level batch | Individual saves create confusion |
| Status indicator | Badge with color | Instant visual scan of progress |
| Progress feedback | Per-row + overall | Both granularity levels needed |

## Streaming Progress Patterns

For long-running bulk operations:

1. **Per-item status badges**: Pending (gray) → InProgress (blue/animated) →
   Done (green)
2. **Overall progress**: "Generating 12 of 45 items..." in table header
3. **Streaming text**: Show generated text appearing character-by-character
   in the proposed column as it generates
4. **Error recovery**: Failed items show red badge with retry option

## Human-in-the-Loop UX

Best practices for approval gates:

1. **Clear call-to-action**: Single "Approve Changes" button, disabled until
   all items are generated
2. **Review summary**: Show count of items modified before approval
3. **Editable before approve**: Let operators tweak AI output before saving
4. **Undo after approve**: Provide a brief undo window (nice-to-have, not
   required for POC)

## Chat Interface Patterns

For the conversational panel:

1. **Standard chat bubbles** — user messages and AI responses
2. **Tool call visualization** — show when the AI is fetching products,
   generating content, etc. as status messages in the chat
3. **Inline data parts** — render custom UI (like the bulk edit table)
   directly within the chat message stream using AI SDK data parts
4. **Multi-turn support** — user can refine instructions after seeing
   initial results ("make these more casual", "add more keywords")

## Responsive Layout

For POC scope:
- Desktop-only layout is acceptable
- Chat on the left (fixed width ~400px), canvas on the right (fluid)
- Or: full-width chat with table rendered inline as a message part
- Recommendation for POC: **inline table as message data part** — simpler
  architecture, leverages AI SDK's parts system naturally
