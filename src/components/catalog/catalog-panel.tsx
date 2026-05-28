import { BulkEditTable, type BulkEditItem } from "@/components/catalog/bulk-edit-table";

interface CatalogPanelProps {
  productItems: BulkEditItem[];
  categoryItems: BulkEditItem[];
  pendingSaveToolCallIds: Record<"product" | "category", string | null>;
  onApprove: (entityType: "product" | "category") => void;
  onReject: (entityType: "product" | "category") => void;
}

export function CatalogPanel({
  productItems,
  categoryItems,
  pendingSaveToolCallIds,
  onApprove,
  onReject,
}: CatalogPanelProps) {
  const hasData = productItems.length > 0 || categoryItems.length > 0;

  if (!hasData) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {productItems.length > 0 && (
          <BulkEditTable
            title="Product Content Updates"
            description={`${productItems.length} products to review`}
            entityType="product"
            items={productItems}
            pendingApproval={!!pendingSaveToolCallIds.product}
            onApprove={() => onApprove("product")}
            onReject={() => onReject("product")}
          />
        )}

        {categoryItems.length > 0 && (
          <BulkEditTable
            title="Category Content Updates"
            description={`${categoryItems.length} categories to review`}
            entityType="category"
            items={categoryItems}
            pendingApproval={!!pendingSaveToolCallIds.category}
            onApprove={() => onApprove("category")}
            onReject={() => onReject("category")}
          />
        )}
      </div>
    </div>
  );
}
