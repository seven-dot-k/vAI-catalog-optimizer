import type { AgentDefinition } from "./types";
import { catalogAgent } from "./catalog-agent";
import { orderSupportAgent } from "./order-support-agent";

/**
 * Central registry of all available agents.
 * The triage agent and handoff tool both read from this registry
 * so adding a new agent is a single-file change plus a registration here.
 */
export const agentRegistry: Record<string, AgentDefinition> = {
  [catalogAgent.id]: catalogAgent,
  [orderSupportAgent.id]: orderSupportAgent,
};

/** List of agent summaries the triage prompt can interpolate. */
export function getAgentSummaries(): string {
  return Object.values(agentRegistry)
    .map((a) => `- **${a.id}**: ${a.description}`)
    .join("\n");
}
