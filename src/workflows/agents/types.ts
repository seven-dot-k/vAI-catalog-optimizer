import type { ToolSet } from "ai";

/**
 * Describes a registered agent that the triage router and handoff tool
 * can discover at runtime.
 */
export interface AgentDefinition {
  /** Unique identifier used in state and handoff calls. */
  id: string;
  /** Human-readable name shown in the UI header. */
  name: string;
  /** One-line summary the triage agent uses to decide routing. */
  description: string;
  /** System prompt / instructions for the DurableAgent. */
  systemPrompt: string;
  /** Tool set the agent operates with (handoff is injected separately). */
  tools: ToolSet;
}
