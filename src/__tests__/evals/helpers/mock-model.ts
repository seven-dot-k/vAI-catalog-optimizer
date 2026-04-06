import {
  MockLanguageModelV3,
  simulateReadableStream,
} from "ai/test";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";

export interface MockToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

export interface MockStreamStep {
  toolCalls?: MockToolCall[];
  textResponse?: string;
}

const ZERO_USAGE = {
  inputTokens: {
    total: 0,
    noCache: undefined,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 0, text: undefined, reasoning: undefined },
};

let callIdCounter = 0;

function buildToolCallStreamParts(
  toolCalls: MockToolCall[],
): LanguageModelV3StreamPart[] {
  const parts: LanguageModelV3StreamPart[] = [
    { type: "stream-start", warnings: [] },
  ];

  for (const tc of toolCalls) {
    const id = `call-${++callIdCounter}`;
    const inputStr = JSON.stringify(tc.args);
    parts.push(
      { type: "tool-input-start", id, toolName: tc.toolName },
      { type: "tool-input-delta", id, delta: inputStr },
      { type: "tool-input-end", id },
      { type: "tool-call", toolCallId: id, toolName: tc.toolName, input: inputStr },
    );
  }

  parts.push({
    type: "finish",
    usage: ZERO_USAGE,
    finishReason: { unified: "tool-calls", raw: undefined },
  });

  return parts;
}

function buildTextStreamParts(text: string): LanguageModelV3StreamPart[] {
  const id = `text-${++callIdCounter}`;
  return [
    { type: "stream-start", warnings: [] },
    { type: "text-start", id },
    { type: "text-delta", id, delta: text },
    { type: "text-end", id },
    {
      type: "finish",
      usage: ZERO_USAGE,
      finishReason: { unified: "stop" as const, raw: undefined },
    },
  ];
}

function stepToStreamResult(step: MockStreamStep) {
  const parts =
    step.toolCalls && step.toolCalls.length > 0
      ? buildToolCallStreamParts(step.toolCalls)
      : buildTextStreamParts(step.textResponse ?? "OK");

  return {
    stream: simulateReadableStream({ chunks: parts }),
  };
}

/**
 * Create a MockLanguageModelV3 that replays a scripted sequence of steps.
 *
 * Each step is either a set of tool calls (model decides to call tools)
 * or a text response (model produces final answer).
 *
 * The DurableAgent calls `doStream` once per agentic loop iteration;
 * `mockValues` cycles through the results for successive calls.
 */
export function createMockModel(steps: MockStreamStep[]): MockLanguageModelV3 {
  callIdCounter = 0;
  const results = steps.map(stepToStreamResult);
  // MockLanguageModelV3 array-based doStream is 1-indexed (skips index 0),
  // so prepend a null placeholder to align results correctly.
  return new MockLanguageModelV3({
    doStream: [null as unknown as (typeof results)[0], ...results],
  });
}
