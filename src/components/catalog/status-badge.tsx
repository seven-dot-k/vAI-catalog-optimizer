"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { ItemStatus } from "@/lib/schemas/data-parts";

const statusConfig: Record<
  ItemStatus,
  { label: string; variant: "pending" | "inprogress" | "done" | "failed" }
> = {
  Pending: { label: "Pending", variant: "pending" },
  InProgress: { label: "In Progress", variant: "inprogress" },
  Done: { label: "Done", variant: "done" },
  Failed: { label: "Failed", variant: "failed" },
};

interface StatusBadgeProps {
  status: ItemStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className="gap-1">
      {status === "InProgress" && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {config.label}
    </Badge>
  );
}
