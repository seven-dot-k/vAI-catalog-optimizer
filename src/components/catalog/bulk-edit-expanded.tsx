"use client";

import { Textarea } from "@/components/ui/textarea";
import type { CatalogContent, SEOContent } from "@/lib/schemas/catalog";

interface BulkEditExpandedProps {
  currentContent: CatalogContent;
  currentSeo: SEOContent;
  proposedContent?: CatalogContent;
  proposedSeo?: SEOContent;
  onContentChange: (field: string, value: string) => void;
}

export function BulkEditExpanded({
  currentContent,
  currentSeo,
  proposedContent,
  proposedSeo,
  onContentChange,
}: BulkEditExpandedProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-card">
      {/* Current column */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-1 border-b border-border">
          Current
        </div>
        <FieldReadOnly label="Short Description" value={currentContent.shortDescription} />
        <FieldReadOnly label="Long Description" value={currentContent.longDescription} />
        <div className="mt-2 pt-2 border-t border-dashed border-border">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase">SEO</span>
          <FieldReadOnly label="Meta Title" value={currentSeo.metaTitle} />
          <FieldReadOnly label="Meta Description" value={currentSeo.metaDescription} />
        </div>
      </div>

      {/* Proposed column */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-1 border-b border-border">
          Proposed
        </div>
        <FieldReadOnly
          label="Short Description"
          value={proposedContent?.shortDescription ?? ""}
        />
        <FieldReadOnly
          label="Long Description"
          value={proposedContent?.longDescription ?? ""}
        />
        <div className="mt-2 pt-2 border-t border-dashed border-zinc-200">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase">SEO</span>
          <FieldReadOnly
            label="Meta Title"
            value={proposedSeo?.metaTitle ?? ""}
          />
          <FieldReadOnly
            label="Meta Description"
            value={proposedSeo?.metaDescription ?? ""}
          />
        </div>
      </div>
    </div>
  );
}

function FieldReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <div className="text-[11px] font-semibold text-muted-foreground mb-1">{label}</div>
      <div className="text-sm text-foreground/70 bg-secondary rounded px-2.5 py-2 min-h-[40px]">
        {value || <span className="italic text-muted-foreground/50">Empty</span>}
      </div>
    </div>
  );
}

function FieldEditable({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-2">
      <div className="text-[11px] font-semibold text-muted-foreground mb-1">{label}</div>
      <Textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm min-h-[40px] resize-y"
        rows={2}
      />
    </div>
  );
}
