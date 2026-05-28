"use client";

import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { useMultiTurnChat } from "@/hooks/use-multi-turn-chat";
import { isToolUIPart, getToolName } from "ai";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { CatalogPanel } from "@/components/catalog/catalog-panel";
import type { BulkEditItem } from "@/components/catalog/bulk-edit-table";
import type { DataProductContent, DataCategoryContent } from "@/lib/schemas/data-parts";
import { Package, Link2, Check, PlusIcon, MenuIcon, ClipboardList, MessageSquareText } from "lucide-react";

function isDataProductContent(part: unknown): part is DataProductContent {
  return typeof part === "object" && part !== null && (part as { type?: string }).type === "data-product-content";
}

function isDataCategoryContent(part: unknown): part is DataCategoryContent {
  return typeof part === "object" && part !== null && (part as { type?: string }).type === "data-category-content";
}

export function ChatInterface() {
  const {
    messages,
    sendMessage,
    isGenerating,
    error,
    pendingMessage,
    endSession,
    isActive,
    runId,
  } = useMultiTurnChat();
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const mobilePagerRef = useRef<HTMLDivElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobilePane, setActiveMobilePane] = useState<"chat" | "review">("chat");

  useEffect(() => {
    for (const ref of [desktopScrollRef, mobileScrollRef]) {
      if (ref.current) {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
    }
  }, [messages]);

  // Aggregate data parts across ALL messages for the side panel
  const { productItems, categoryItems } = useMemo(() => {
    const productMap = new Map<string, BulkEditItem>();
    const categoryMap = new Map<string, BulkEditItem>();

    for (const message of messages) {
      for (const part of message.parts) {
        if (isDataProductContent(part)) {
          const d = part.data;
          const existing = productMap.get(d.sku);
          // Null-coalesce with existing data so incremental stream events
          // (Pending → InProgress → Done) don't wipe out proposals from earlier
          // events. Not every event carries the full payload — e.g., an InProgress
          // event may omit proposedContent that was set by a prior Done event.
          productMap.set(d.sku, {
            id: d.sku,
            name: d.name,
            secondaryLabel: d.category,
            status: d.status,
            currentContent: d.currentContent,
            currentSeo: d.currentSeo,
            proposedContent: d.proposedContent ?? existing?.proposedContent,
            proposedSeo: d.proposedSeo ?? existing?.proposedSeo,
          });
        } else if (isDataCategoryContent(part)) {
          const d = part.data;
          const existing = categoryMap.get(d.categoryId);
          categoryMap.set(d.categoryId, {
            id: d.categoryId,
            name: d.name,
            secondaryLabel: d.catalog,
            status: d.status,
            currentContent: d.currentContent,
            currentSeo: d.currentSeo,
            proposedContent: d.proposedContent ?? existing?.proposedContent,
            proposedSeo: d.proposedSeo ?? existing?.proposedSeo,
          });
        }
      }
    }

    return {
      productItems: Array.from(productMap.values()),
      categoryItems: Array.from(categoryMap.values()),
    };
  }, [messages]);

  const hasTableData = productItems.length > 0 || categoryItems.length > 0;

  // Find pending save tool calls (waiting for human approval via hook)
  const pendingSaveToolCallIds = useMemo(() => {
    const ids: Record<"product" | "category", string | null> = { product: null, category: null };
    for (const message of messages) {
      for (const part of message.parts) {
        if (isToolUIPart(part)) {
          const toolName = getToolName(part);
          const isPending = part.state !== "output-available" && part.state !== "output-error";
          if (toolName === "save_products" && isPending) {
            ids.product = part.toolCallId;
          } else if (toolName === "save_categories" && isPending) {
            ids.category = part.toolCallId;
          }
        }
      }
    }
    return ids;
  }, [messages]);

  const handleApprove = useCallback(
    async (entityType: "product" | "category") => {
      const toolCallId = pendingSaveToolCallIds[entityType];
      if (!toolCallId) return;
      try {
        await fetch("/api/hooks/approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolCallId, approved: true }),
        });
      } catch (err) {
        console.error("Error approving:", err);
      }
    },
    [pendingSaveToolCallIds],
  );

  const handleReject = useCallback(
    async (entityType: "product" | "category") => {
      const toolCallId = pendingSaveToolCallIds[entityType];
      if (!toolCallId) return;
      try {
        await fetch("/api/hooks/approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolCallId, approved: false }),
        });
      } catch (err) {
        console.error("Error rejecting:", err);
      }
    },
    [pendingSaveToolCallIds],
  );

  const hasPendingApproval = !!pendingSaveToolCallIds.product || !!pendingSaveToolCallIds.category;

  const handleCopyLink = useCallback(() => {
    if (!runId) return;

    const url = new URL(window.location.href);
    url.searchParams.set("session", runId);
    navigator.clipboard.writeText(url.toString());
    setLinkCopied(true);
    setMobileMenuOpen(false);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [runId]);

  const handleNewSession = useCallback(() => {
    setMobileMenuOpen(false);
    endSession();
  }, [endSession]);

  const scrollToMobilePane = useCallback((pane: "chat" | "review") => {
    setActiveMobilePane(pane);
    const pager = mobilePagerRef.current;
    if (!pager) return;

    pager.scrollTo({
      left: pane === "chat" ? 0 : pager.clientWidth,
      behavior: "smooth",
    });
  }, []);

  const handleMobilePagerScroll = useCallback(() => {
    const pager = mobilePagerRef.current;
    if (!pager) return;

    setActiveMobilePane(pager.scrollLeft > pager.clientWidth / 2 ? "review" : "chat");
  }, []);

  const renderHeaderActions = () => (
    <>
      {isActive && runId && (
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {linkCopied ? (
            <><Check className="size-3" /> Copied</>
          ) : (
            <><Link2 className="size-3" /> Share</>
          )}
        </button>
      )}
      {isActive && (
        <button
          type="button"
          onClick={handleNewSession}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <PlusIcon className="size-3" /> New Session
        </button>
      )}
      <span className="text-xs text-muted-foreground">
        {isGenerating && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            Generating
          </span>
        )}
      </span>
    </>
  );

  const header = (
    <header className="relative flex items-center justify-between px-4 py-3 border-b border-border md:px-6">
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package className="size-3.5" />
        </div>
        <span className="font-semibold text-sm text-foreground">CatalogManager</span>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        {renderHeaderActions()}
      </div>

      <button
        type="button"
        onClick={() => setMobileMenuOpen((open) => !open)}
        className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        aria-label="Open session actions"
        aria-expanded={mobileMenuOpen}
      >
        <MenuIcon className="size-4" />
      </button>

      {mobileMenuOpen && (
        <div className="absolute right-4 top-[calc(100%+0.5rem)] z-20 flex min-w-44 flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-xl md:hidden">
          {renderHeaderActions()}
          {!isActive && !isGenerating && (
            <span className="text-xs text-muted-foreground">No active session</span>
          )}
        </div>
      )}
    </header>
  );

  const errorBanner = error && (
    <div className="mx-4 mt-3 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm md:mx-6">
      {error.message}
    </div>
  );

  const messagesPane = (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 p-4 md:p-6">
      {messages.length === 0 && !pendingMessage && (
        <div className="flex flex-col items-center justify-center py-24 text-center md:py-32">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary mb-4">
            <Package className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">CatalogManager AI</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Optimize product descriptions, category content, and SEO metadata using your brand voice.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Optimize descriptions for electronics",
              "Generate SEO data for all products",
              "Update the Sports category description",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {pendingMessage && (
        <div className="flex w-full max-w-[95%] flex-col gap-2 ml-auto items-end">
          <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground opacity-60">
            {pendingMessage}
          </div>
        </div>
      )}
    </div>
  );

  const catalogPanel = hasTableData ? (
    <CatalogPanel
      productItems={productItems}
      categoryItems={categoryItems}
      pendingSaveToolCallIds={pendingSaveToolCallIds}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  ) : (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary">
        <ClipboardList className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mb-1 text-lg font-semibold text-foreground">No content to review</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Product and category updates will appear here when the assistant generates reviewable content.
      </p>
    </div>
  );

  const renderInput = () => (
    <ChatInput
      onSend={(text) => sendMessage(text)}
      disabled={isGenerating || hasPendingApproval}
    />
  );

  return (
    <div className="h-dvh bg-background md:h-screen">
      <div className="hidden h-full flex-col md:flex">
        {header}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className={`flex min-w-0 flex-col ${hasTableData ? "basis-1/3 xl:basis-1/2" : "flex-1"}`}>
            {errorBanner}
            <div ref={desktopScrollRef} className="flex-1 overflow-y-auto">
              {messagesPane}
            </div>
            <div className="mx-auto w-full max-w-2xl">
              {renderInput()}
            </div>
          </div>

          {hasTableData && (
            <div className="min-w-0 basis-2/3 border-l border-border xl:basis-1/2">
              {catalogPanel}
            </div>
          )}
        </div>
      </div>

      <div className="grid h-full grid-rows-[auto_auto_auto_minmax(0,1fr)] md:hidden">
        {header}
        {errorBanner}
        <div className="flex items-center gap-1 border-b border-border px-4 py-2">
          <button
            type="button"
            onClick={() => scrollToMobilePane("chat")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeMobilePane === "chat"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquareText className="size-4" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => scrollToMobilePane("review")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeMobilePane === "review"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="size-4" />
            Review
            {hasTableData && <span className="size-1.5 rounded-full bg-green-500" />}
          </button>
        </div>

        <div
          ref={mobilePagerRef}
          onScroll={handleMobilePagerScroll}
          className="flex min-h-0 snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            ref={mobileScrollRef}
            className="min-w-full snap-start overflow-y-auto pb-[calc(112px+env(safe-area-inset-bottom))]"
            aria-label="Chat messages"
          >
            {messagesPane}
          </div>
          <section
            className="min-w-full snap-start overflow-y-auto pb-[calc(112px+env(safe-area-inset-bottom))]"
            aria-label="Content review"
          >
            <div className="h-full">
              {catalogPanel}
            </div>
          </section>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
          <div className="mx-auto w-full max-w-2xl">
            {renderInput()}
          </div>
        </div>
      </div>
    </div>
  );
}
