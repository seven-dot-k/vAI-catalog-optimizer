# Data Model: Workflow Evals & Testing

**Feature**: `001-workflow-evals-testing`

## Entities

### EvalScenario

Represents a single eval test case configuration.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Descriptive test name |
| userMessage | string | The prompt sent to the agent |
| mockToolResponses | Record<string, unknown> | Maps tool name → mocked return value |
| expectedToolCalls | ExpectedToolCall[] | Ordered list of expected tool invocations |
| followUpMessages | string[] (optional) | Additional user messages for multi-turn scenarios |

### ExpectedToolCall

Represents a single expected tool invocation assertion.

| Field | Type | Description |
|-------|------|-------------|
| toolName | string | Name of the tool (e.g., `get_products`) |
| expectedParams | Record<string, unknown> (partial) | Subset of parameters to assert via `expect.objectContaining()` |
| shouldNotBeCalled | boolean (optional) | When true, asserts this tool was NOT called |

### MockToolSet

Cloned tool definitions with `execute` replaced by `vi.fn()`.

| Field | Type | Description |
|-------|------|-------------|
| get_products | ToolDef with vi.fn() execute | Returns mocked product array |
| get_brand_voice | ToolDef with vi.fn() execute | Returns mocked brand voice string |
| generate_descriptions | ToolDef with vi.fn() execute | Returns mocked generation results |
| generate_seo_data | ToolDef with vi.fn() execute | Returns mocked SEO generation results |
| save_products | ToolDef with vi.fn() execute | Returns mocked save confirmation |

### MockStreamStep

Configuration for a single `doStream` response from `MockLanguageModelV3`.

| Field | Type | Description |
|-------|------|-------------|
| toolCalls | Array<{ toolName, args }> (optional) | Tool calls to emit in this step |
| textResponse | string (optional) | Text response to emit (final step) |
| finishReason | 'tool-calls' or 'stop' | How this step ends |

## Relationships

```text
EvalScenario 1 ──* ExpectedToolCall
EvalScenario 1 ── 1 MockToolSet
EvalScenario 1 ──* MockStreamStep (via MockLanguageModelV3)
```

## State Transitions

N/A — eval scenarios are stateless test cases. Each test creates fresh mock instances.
