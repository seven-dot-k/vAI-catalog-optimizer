"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useParams, useSearchParams } from "next/navigation";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { MessageSquare, SendIcon } from "lucide-react";

export function StorefrontChat() {
  const [input, setInput] = useState("");
  const params = useParams<{ sku: string }>();
  const searchParams = useSearchParams();
  const userSegment = searchParams.get("userSegment");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/storefront-chat" }),
  })

  const isStreaming = status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(
      { text: input },
      { body: { sku: params.sku, userSegment: userSegment ?? undefined } },
    );
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Shopping Assistant</h2>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-8" />}
              title="Need help?"
              description="Ask me anything about our products."
            />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <MessageResponse key={`${message.id}-${i}`}>
                          {part.text}
                        </MessageResponse>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            <SendIcon className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
