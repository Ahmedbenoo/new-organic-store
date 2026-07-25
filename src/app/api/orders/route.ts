import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { createOrder, readOrders } from "@/lib/orders-store";
import type { OrderItem } from "@/lib/types";

export async function GET() {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const orders = await readOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to read orders:", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customer_name?: string;
      customer_phone?: string;
      customer_address?: string;
      items?: OrderItem[];
      total?: number;
      notes?: string;
      whatsapp_sent?: boolean;
    };

    if (
      !body.customer_name ||
      !body.customer_phone ||
      !body.customer_address ||
      !Array.isArray(body.items)
    ) {
      return NextResponse.json(
        { error: "Missing required order fields" },
        { status: 400 },
      );
    }

    const order = await createOrder({
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_address: body.customer_address,
      items: body.items,
      total: body.total ?? 0,
      notes: body.notes ?? "",
      whatsapp_sent: body.whatsapp_sent ?? false,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to save order" },
      { status: 500 },
    );
  }
}
