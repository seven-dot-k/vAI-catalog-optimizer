"use client";

import { useState, useCallback } from "react";
import { ClipboardList } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { BulkEditRow } from "./bulk-edit-row";
import { BulkEditExpanded } from "./bulk-edit-expanded";
import type { CatalogContent, SEOContent } from "@/lib/schemas/catalog";
import type { ItemStatus } from "@/lib/schemas/data-parts";

export interface BulkEditItem {
  id: string;
  name: string;
  secondaryLabel: string;
  status: ItemStatus;
  currentContent: CatalogContent;
  currentSeo: SEOContent;
  proposedContent?: CatalogContent;
  proposedSeo?: SEOContent;
}

interface BulkEditTableProps {
  title: string;
  description: string;
  entityType: "product" | "category";
  items: BulkEditItem[];
  pendingApproval: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function BulkEditTable({
  title,
  description,
  entityType,
  items,
  pendingApproval,
  onApprove,
  onReject,
}: BulkEditTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<
    Map<string, { content?: Partial<CatalogContent>; seo?: Partial<SEOContent> }>
  >(new Map());

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleContentChange = useCallback(
    (itemId: string, field: string, value: string) => {
      setEdits((prev) => {
        const next = new Map(prev);
        const existing = next.get(itemId) ?? {};
        if (field.startsWith("seo")) {
          const seoField = field === "seoMetaTitle" ? "metaTitle" : "metaDescription";
          existing.seo = { ...existing.seo, [seoField]: value };
        } else {
          existing.content = { ...existing.content, [field]: value };
        }
        next.set(itemId, existing);
        return next;
      });
    },
    []
  );

  const doneCount = items.filter((i) => i.status === "Done").length;

  const handleApprove = () => {
    onApprove();
  };

  const secondaryHeader = entityType === "product" ? "Category" : "Catalog";

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(doneCount / items.length) * 100}%` }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_120px_100px_40px] px-4 py-2 bg-secondary text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span />
          <span>Name</span>
          <span>{secondaryHeader}</span>
          <span>Status</span>
          <span />
        </div>

        {/* Rows */}
        {items.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          const itemEdits = edits.get(item.id);

          const displayedProposedContent = item.proposedContent
            ? {
                shortDescription:
                  itemEdits?.content?.shortDescription ??
                  item.proposedContent.shortDescription,
                longDescription:
                  itemEdits?.content?.longDescription ??
                  item.proposedContent.longDescription,
              }
            : undefined;

          const displayedProposedSeo = item.proposedSeo
            ? {
                metaTitle:
                  itemEdits?.seo?.metaTitle ?? item.proposedSeo.metaTitle,
                metaDescription:
                  itemEdits?.seo?.metaDescription ??
                  item.proposedSeo.metaDescription,
              }
            : undefined;

          return (
            <Collapsible
              key={item.id}
              open={isExpanded}
              onOpenChange={() => toggleExpand(item.id)}
            >
              <CollapsibleTrigger asChild>
                <div>
                  <BulkEditRow
                    name={item.name}
                    secondaryLabel={item.secondaryLabel}
                    status={item.status}
                    isExpanded={isExpanded}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <BulkEditExpanded
                  currentContent={item.currentContent}
                  currentSeo={item.currentSeo}
                  proposedContent={displayedProposedContent}
                  proposedSeo={displayedProposedSeo}
                  onContentChange={(field, value) =>
                    handleContentChange(item.id, field, value)
                  }
                />
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>

      <CardFooter>
        <span className="text-sm text-muted-foreground">
          {doneCount} of {items.length} complete
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!pendingApproval}
            onClick={onReject}
          >
            ✗ Reject
          </Button>
          <Button
            variant="success"
            disabled={!pendingApproval}
            onClick={handleApprove}
          >
            ✓ Approve & Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
