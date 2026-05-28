"use client";

import { Textarea } from "@/components/ui/textarea";
import type { CatalogContent, SEOContent } from "@/lib/schemas/catalog";

interface BulkEditExpandedProps {
  currentContent: CatalogContent;
  currentSeo: SEOContent;
  proposedContent?: CatalogContent;
  proposedSeo?: SEOContent;
  onContentChange: (field: string, value: string) => void;
  /** When true, the Proposed column renders editable textareas. Defaults to read-only. */
  editable?: boolean;
}

export function BulkEditExpanded({
  currentContent,
  currentSeo,
  proposedContent,
  proposedSeo,
  onContentChange,
  editable = false,
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
        <ProposedField
          editable={editable}
          label="Short Description"
          value={proposedContent?.shortDescription ?? ""}
          placeholder="No proposed short description"
          onChange={(value) => onContentChange("shortDescription", value)}
        />
        <ProposedField
          editable={editable}
          label="Long Description"
          value={proposedContent?.longDescription ?? ""}
          placeholder="No proposed long description"
          onChange={(value) => onContentChange("longDescription", value)}
        />
        <div className="mt-2 pt-2 border-t border-dashed border-zinc-200">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase">SEO</span>
          <ProposedField
            editable={editable}
            label="Meta Title"
            value={proposedSeo?.metaTitle ?? ""}
            placeholder="No proposed meta title"
            onChange={(value) => onContentChange("seoMetaTitle", value)}
          />
          <ProposedField
            editable={editable}
            label="Meta Description"
            value={proposedSeo?.metaDescription ?? ""}
            placeholder="No proposed meta description"
            onChange={(value) => onContentChange("seoMetaDescription", value)}
          />
        </div>
      </div>
    </div>
  );
}

function ProposedField({
  editable,
  label,
  value,
  placeholder,
  onChange,
}: {
  editable: boolean;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  if (editable) {
    return (
      <FieldEditable
        label={label}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    );
  }
  return <FieldReadOnly label={label} value={value} />;
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
