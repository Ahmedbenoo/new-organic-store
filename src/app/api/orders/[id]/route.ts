import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { updateOrderStatus } from "@/lib/orders-store";
import type { Order } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const body = (await request.json()) as { status?: Order["status"] };

    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const order = await updateOrderStatus(id, body.status);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}
