"use client";

import { ChevronRight } from "lucide-react";
import { StatusBadge } from "./status-badge";
import type { ItemStatus } from "@/lib/schemas/data-parts";
import { cn } from "@/lib/utils";

interface BulkEditRowProps {
  name: string;
  secondaryLabel: string;
  status: ItemStatus;
  isExpanded: boolean;
  onToggle?: () => void;
}

export function BulkEditRow({
  name,
  secondaryLabel,
  status,
  isExpanded,
  onToggle,
}: BulkEditRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "grid grid-cols-[40px_1fr_120px_100px_40px] items-center w-full px-4 py-2.5 text-left border-b border-border hover:bg-accent/50 transition-colors cursor-pointer",
        isExpanded && "bg-accent/30"
      )}
    >
      <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-[10px] text-muted-foreground">
        IMG
      </div>
      <div className="font-medium text-sm text-foreground truncate pl-2">{name}</div>
      <div className="text-sm text-muted-foreground truncate">{secondaryLabel}</div>
      <div>
        <StatusBadge status={status} />
      </div>
      <div className="flex justify-center">
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-90"
          )}
        />
      </div>
    </button>
  );
}
