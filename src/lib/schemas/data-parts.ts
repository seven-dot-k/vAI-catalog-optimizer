import type { CatalogContent, SEOContent } from "./catalog";
import type { OrderItem } from "./order";

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

export interface DataOrderInfo {
  type: "data-order-info";
  id: string;
  data: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    status: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    shippingAddress: string;
    trackingNumber?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface DataAgentSwitch {
  type: "data-agent-switch";
  id: string;
  data: {
    agentId: string;
    agentName: string;
    timestamp: number;
  };
}

export type CatalogDataPart =
  | DataProductContent
  | DataCategoryContent
  | DataApprovalRequest
  | DataOrderInfo
  | DataAgentSwitch;
