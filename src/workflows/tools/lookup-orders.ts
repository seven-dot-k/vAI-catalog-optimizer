import { z } from "zod";
import { getOrderById, getOrdersByCustomer } from "@/lib/data/orders";

async function executeLookupOrders({
  orderId,
  customerEmail,
}: {
  orderId?: string;
  customerEmail?: string;
}) {
  "use step";

  if (orderId) {
    const order = getOrderById(orderId);
    if (!order) return { orders: [], message: `No order found with ID "${orderId}"` };
    return { orders: [order], message: `Found order ${orderId}` };
  }

  if (customerEmail) {
    const orders = getOrdersByCustomer(customerEmail);
    return {
      orders,
      message: orders.length
        ? `Found ${orders.length} order(s) for ${customerEmail}`
        : `No orders found for ${customerEmail}`,
    };
  }

  return { orders: [], message: "Please provide an order ID or customer email to look up orders." };
}

export const lookupOrdersToolDef = {
  description:
    "Look up orders by order ID or customer email. Returns matching order summaries.",
  inputSchema: z.object({
    orderId: z
      .string()
      .optional()
      .describe("The order ID to look up (e.g. 'ORD-10001')"),
    customerEmail: z
      .string()
      .optional()
      .describe("Customer email to find all their orders"),
  }),
  execute: executeLookupOrders,
};
