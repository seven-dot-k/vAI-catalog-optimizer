import { z } from "zod";
import { agentRegistry, getAgentSummaries } from "./registry";

/**
 * Builds a triage system prompt dynamically from the agent registry.
 * The triage agent's only job is to classify the user's intent and return
 * the id of the best-matching specialist agent.
 */
export function buildTriagePrompt(): string {
  const summaries = getAgentSummaries();
  const ids = Object.keys(agentRegistry).join(", ");

  return `You are a triage router for a multi-agent e-commerce assistant. Your job is to classify the user's message and decide which specialist agent should handle it.

## Available Agents
${summaries}

## Instructions
1. Read the user's message carefully.
2. Decide which agent is the best fit based on the descriptions above.
3. Call the route tool with the exact agent id. Valid ids: ${ids}
4. If the request is ambiguous or could go either way, pick the most likely match and include a brief reason.
5. Do NOT try to answer the user's question yourself — you are only a router.
6. Messages about orders, order status, shipping, cancellations, or tracking should ALWAYS go to "order-support".
7. Messages about product descriptions, SEO, content optimization, or brand voice should go to "catalog".
`;
}

/** Build a Zod enum from the current registry keys for type-safe routing. */
function agentIdEnum() {
  const keys = Object.keys(agentRegistry) as [string, ...string[]];
  return z.enum(keys);
}

/** Result of a triage classification. */
export interface TriageResult {
  agentId: string;
  reason: string;
}

/**
 * Triage tool that the triage DurableAgent calls to declare its routing decision.
 * The agentId input is constrained to a z.enum of valid registry keys so the
 * model cannot hallucinate an id.
 */
export const triageRouteTool = {
  description: "Route the conversation to the best specialist agent.",
  inputSchema: z.object({
    agentId: agentIdEnum()
      .describe("The id of the agent to route to"),
    reason: z
      .string()
      .describe("Brief explanation of why this agent was chosen"),
  }),
  execute: async ({
    agentId,
    reason,
  }: {
    agentId: string;
    reason: string;
  }): Promise<TriageResult | { error: string }> => {
    "use step";

    if (!agentRegistry[agentId]) {
      const available = Object.keys(agentRegistry).join(", ");
      return { error: `Unknown agent "${agentId}". Available: ${available}` };
    }
    return { agentId, reason };
  },
};
