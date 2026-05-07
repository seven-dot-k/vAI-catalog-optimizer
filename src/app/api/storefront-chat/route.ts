import { UIMessage, createAgentUIStreamResponse } from "ai";
import { shoppingAgent } from "@/lib/agent/shopping-agent";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, sku, userSegment }: { messages: UIMessage[]; sku: string; userSegment?: string } = await req.json();

  return createAgentUIStreamResponse({
    agent: shoppingAgent,
    uiMessages: messages,
    options: { sku, userSegment },
  });
}
