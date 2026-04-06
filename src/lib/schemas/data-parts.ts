import type { CatalogContent, SEOContent } from "./catalog";

export type ItemStatus = "Pending" | "InProgress" | "Done" | "Failed";

export interface DataProductContent {
  type: "data-product-content";
  id: string;
  data: {
    sku: string;
    name: string;
    category: string;
    currentContent: CatalogContent;
    currentSeo: SEOContent;
    proposedContent?: CatalogContent;
    proposedSeo?: SEOContent;
    status: ItemStatus;
    errorMessage?: string;
  };
}

export interface DataCategoryContent {
  type: "data-category-content";
  id: string;
  data: {
    categoryId: string;
    name: string;
    catalog: string;
    currentContent: CatalogContent;
    currentSeo: SEOContent;
    proposedContent?: CatalogContent;
    proposedSeo?: SEOContent;
    status: ItemStatus;
    errorMessage?: string;
  };
}

export interface DataApprovalRequest {
  type: "data-approval-request";
  id: string;
  data: {
    entityType: "product" | "category";
    itemCount: number;
    message: string;
  };
}

export type CatalogDataPart =
  | DataProductContent
  | DataCategoryContent
  | DataApprovalRequest;
