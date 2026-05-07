import { tool } from "ai";
import { z } from "zod";
import { getProductDetail } from "@/lib/data/product-details";

export const getProductManual = tool({
  description: "Get the user manual sections for a product by its SKU",
  inputSchema: z.object({
    sku: z.string().describe("The product SKU, e.g. ELEC-001"),
  }),
  execute: async ({ sku }) => {
    const detail = getProductDetail(sku);
    if (!detail) {
      return { error: `No manual found for product SKU: ${sku}` };
    }
    return { sku, manual: detail.manual };
  },
});
