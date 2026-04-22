import {
  convertToModelMessages,
  type UIMessageChunk,
  type UIMessage,
  type ModelMessage,
} from "ai";
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable, getWorkflowMetadata } from "workflow";

const MAX_TURNS = 50;
const MAX_STEPS_PER_TURN = 15;
import { chatMessageHook } from "./hooks/chat-message";
import {
  writeUserMessageMarker,
  writeStreamClose,
  writeTurnEnd,
  writeAgentSwitch,
} from "./steps/writer";
import { agentRegistry, buildTriagePrompt, triageRouteTool } from "./agents";
import type { AgentDefinition, TriageResult } from "./agents";
import { handoffToolDef, isHandoffResult } from "./tools/handoff";

// Re-export for backward compatibility with tests that import from here
export { agentRegistry } from "./agents";
export { CATALOG_SYSTEM_PROMPT as SYSTEM_PROMPT, catalogTools } from "./agents/catalog-agent";

/**
 * Build a DurableAgent for a given agent definition, injecting the shared
 * handoff tool alongside the agent's own tools.
 */
function buildAgent(def: AgentDefinition): DurableAgent {
  return new DurableAgent({
    model: "anthropic/claude-sonnet-4-6",
    instructions: def.systemPrompt,
    tools: { ...def.tools, handoff: handoffToolDef },
  });
}

/**
 * Run the lightweight triage agent to classify a message and pick the best
 * specialist agent. Returns the agent id.
 */
async function runTriage(
  messages: ModelMessage[],
  writable: WritableStream<UIMessageChunk>,
): Promise<string> {
  const triage = new DurableAgent({
    model: "anthropic/claude-sonnet-4-6",
    instructions: buildTriagePrompt(),
    tools: { route: triageRouteTool },
  });

  const result = await triage.stream({
    messages,
    writable,
    preventClose: true,
    sendStart: false,
    sendFinish: false,
    maxSteps: 3,
  });

  // Find the route tool result in the steps
  for (const step of result.steps) {
    for (const toolResult of step.toolResults ?? []) {
      const value = (toolResult as unknown as { output: unknown }).output as TriageResult | { error: string };
      if ("agentId" in value && agentRegistry[value.agentId]) {
        return value.agentId;
      }
    }
  }

  // Fallback: default to catalog agent if triage didn't produce a clear route
  return "catalog";
}

/**
 * Multi-turn chat workflow with dynamic agent routing.
 *
 * A single workflow handles the entire conversation. The active agent is tracked
 * in local state so triage only runs when no agent is controlling the session
 * (first message) or after an explicit handoff.
 */
export async function catalogAgentWorkflow(initialMessages: UIMessage[]) {
  "use workflow";

  const { workflowRunId: runId, workflowStartedAt } = getWorkflowMetadata();
  const writable = getWritable<UIMessageChunk>();
  const workflowStartTime = workflowStartedAt.getTime();

  // Convert UI messages to model messages for the agent
  const messages: ModelMessage[] = await convertToModelMessages(initialMessages);

  // Write markers for initial user messages (for replay purposes)
  let isFirstUserMessage = true;
  for (const msg of initialMessages) {
    if (msg.role === "user") {
      const textContent = msg.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("");
      if (textContent) {
        await writeUserMessageMarker(writable, textContent, msg.id, {
          turnNumber: 1,
          turnStartedAt: workflowStartTime,
          workflowRunId: runId,
          workflowStartedAt: workflowStartTime,
          isFirstTurn: isFirstUserMessage,
        });
        isFirstUserMessage = false;
      }
    }
  }

  // --- Agent routing state ---
  // null = no agent selected yet → triage on next turn
  let activeAgentId: string | null = null;
  let activeAgent: DurableAgent | null = null;

  // Create a hook that uses the run ID as the token for resumption
  const hook = chatMessageHook.create({ token: runId });

  let turnNumber = 0;
  let totalStepCount = 0;

  // Main conversation loop — bounded to prevent infinite sessions
  while (turnNumber < MAX_TURNS) {
    turnNumber++;
    const turnStartTime = Date.now();

    // --- Triage if no active agent ---
    if (!activeAgentId) {
      const routed = await runTriage(messages, writable);
      activeAgentId = routed;
      activeAgent = buildAgent(agentRegistry[routed]);
      await writeAgentSwitch(writable, routed, agentRegistry[routed].name);
    }

    let result;
    try {
      result = await activeAgent!.stream({
        messages,
        writable,
        preventClose: true,
        sendStart: turnNumber === 1,
        sendFinish: false,
        maxSteps: MAX_STEPS_PER_TURN,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[workflow:${runId}] Agent stream failed on turn ${turnNumber}:`, errorMessage);

      const writer = writable.getWriter();
      try {
        await writer.write({
          type: "error",
          errorMessage: `An error occurred during processing: ${errorMessage}`,
        } as unknown as UIMessageChunk);
      } finally {
        writer.releaseLock();
      }
      break;
    }

    // --- Detect handoff in tool results ---
    let handoffTarget: string | null = null;
    for (const step of result.steps) {
      for (const toolResult of step.toolResults ?? []) {
        const output = (toolResult as unknown as { output: unknown }).output;
        if (isHandoffResult(output)) {
          handoffTarget = output.targetAgentId;
        }
      }
    }

    const stepsForTurn = result.steps.map((step, index) => ({
      stepNumber: totalStepCount + index + 1,
      toolCalls: step.toolCalls?.map((tc) => tc.toolName) || [],
      finishReason: step.finishReason || "unknown",
    }));

    totalStepCount = await writeTurnEnd(
      writable,
      turnNumber,
      Date.now() - turnStartTime,
      stepsForTurn,
      totalStepCount,
    );

    messages.push(...result.messages);

    // --- Apply handoff: switch agent and re-run this turn ---
    if (handoffTarget && agentRegistry[handoffTarget]) {
      activeAgentId = handoffTarget;
      activeAgent = buildAgent(agentRegistry[handoffTarget]);
      await writeAgentSwitch(writable, handoffTarget, agentRegistry[handoffTarget].name);
      // Continue the loop so the new agent can process the conversation
      continue;
    }

    // Wait for next user message via hook
    const { message: followUp } = await hook;

    // Check for session end signal
    if (followUp === "/done") {
      break;
    }

    const nextTurnNumber = turnNumber + 1;
    const followUpId = `user-${runId}-${nextTurnNumber}`;
    const followUpTurnStartTime = Date.now();

    await writeUserMessageMarker(writable, followUp, followUpId, {
      turnNumber: nextTurnNumber,
      turnStartedAt: followUpTurnStartTime,
      workflowRunId: runId,
      workflowStartedAt: workflowStartTime,
      isFirstTurn: false,
    });

    messages.push({ role: "user", content: followUp });
  }

  // Close the stream with workflow-end observability data
  await writeStreamClose(writable, {
    workflowRunId: runId,
    totalDurationMs: Date.now() - workflowStartTime,
    turnCount: turnNumber,
  });

  return { messages };
}
