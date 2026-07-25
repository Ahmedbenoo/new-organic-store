import { NextResponse } from "next/server";
import {
  findOrdersByIds,
  findOrdersByPhone,
} from "@/lib/orders-store";
import type { Order } from "@/lib/types";

function mergeOrders(...groups: Order[][]): Order[] {
  const map = new Map<string, Order>();

  for (const group of groups) {
    for (const order of group) {
      map.set(order.id, order);
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone")?.trim() ?? "";
    const idsParam = searchParams.get("ids")?.trim() ?? "";
    const ids = idsParam
      ? idsParam.split(",").map((id) => id.trim()).filter(Boolean)
      : [];

    if (!phone && ids.length === 0) {
      return NextResponse.json(
        { error: "Phone number or order IDs are required" },
        { status: 400 },
      );
    }

    const [phoneOrders, idOrders] = await Promise.all([
      phone ? findOrdersByPhone(phone) : Promise.resolve([]),
      ids.length > 0 ? findOrdersByIds(ids) : Promise.resolve([]),
    ]);

    return NextResponse.json({ orders: mergeOrders(phoneOrders, idOrders) });
  } catch (error) {
    console.error("Failed to lookup orders:", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}
