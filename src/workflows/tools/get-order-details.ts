import { z } from "zod";
import { getOrderById } from "@/lib/data/orders";
import type { UIMessageChunk } from "ai";
import { getWritable } from "workflow";

async function executeGetOrderDetails({ orderId }: { orderId: string }) {
  "use step";

  const order = getOrderById(orderId);
  if (!order) {
    return { error: `Order ${orderId} not found` };
  }

  // Write a data part so the UI can render an order info card
  const writable = getWritable<UIMessageChunk>();
  const writer = writable.getWriter();
  try {
    await writer.write({
      type: "data-workflow",
      data: {
        type: "order-info",
        orderId: order.orderId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: order.status,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    } as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }

  return {
    order,
    message: `Order ${orderId} details displayed to user.`,
  };
}

export const getOrderDetailsToolDef = {
  description:
    "Get full details for an order and display an order info card in the chat. Use after looking up an order.",
  inputSchema: z.object({
    orderId: z.string().describe("The order ID to get details for"),
  }),
  execute: executeGetOrderDetails,
};
