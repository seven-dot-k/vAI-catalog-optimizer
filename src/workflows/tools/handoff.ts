import { z } from "zod";
import { agentRegistry, getAgentSummaries } from "../agents/registry";

/**
 * Sentinel value the workflow loop checks to detect a handoff.
 * When the tool result contains `__handoff: true`, the loop breaks
 * out of the current agent's turn and switches to `targetAgentId`.
 */
export interface HandoffResult {
  __handoff: true;
  targetAgentId: string;
  reason: string;
}

export function isHandoffResult(value: unknown): value is HandoffResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).__handoff === true
  );
}

async function executeHandoff({
  targetAgentId,
  reason,
}: {
  targetAgentId: string;
  reason: string;
}): Promise<HandoffResult | { error: string }> {
  "use step";

  if (!agentRegistry[targetAgentId]) {
    const available = Object.keys(agentRegistry).join(", ");
    return {
      error: `Unknown agent "${targetAgentId}". Available agents: ${available}`,
    };
  }

  return { __handoff: true, targetAgentId, reason };
}

/** Build the agent list once so we're not re-computing on every call. */
const agentList = getAgentSummaries();

export const handoffToolDef = {
  description: `Transfer the conversation to a different specialist agent. Available agents:\n${agentList}\nCall this when the user's request falls outside your expertise.`,
  inputSchema: z.object({
    targetAgentId: z
      .string()
      .describe("The id of the agent to hand off to"),
    reason: z
      .string()
      .describe(
        "Brief explanation of why you are handing off (shown to the user)",
      ),
  }),
  execute: executeHandoff,
};
