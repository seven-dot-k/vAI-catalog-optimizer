import { z } from "zod";
import { cancelOrder } from "@/lib/data/orders";

async function executeCancelOrder({ orderId }: { orderId: string }) {
  "use step";

  const result = cancelOrder(orderId);

  if ("error" in result) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    order: result,
    message: `Order ${orderId} has been cancelled successfully.`,
  };
}

export const cancelOrderToolDef = {
  description:
    "Cancel an order. Only pending, confirmed, or processing orders can be cancelled. Shipped or delivered orders cannot be cancelled.",
  inputSchema: z.object({
    orderId: z.string().describe("The order ID to cancel"),
  }),
  execute: executeCancelOrder,
};
