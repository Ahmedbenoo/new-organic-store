import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { phonesMatch } from "@/lib/phone";
import type { Order, OrderItem } from "@/lib/types";

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total: number;
  status: Order["status"];
  whatsapp_sent: boolean;
  notes: string;
  created_at: string;
};

function getClient() {
  return getSupabaseAdminClient();
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_address: row.customer_address,
    items: Array.isArray(row.items) ? row.items : [],
    total: row.total,
    status: row.status,
    whatsapp_sent: row.whatsapp_sent,
    notes: row.notes,
    created_at: row.created_at,
  };
}

function orderToRow(order: Order): OrderRow {
  return {
    id: order.id,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_address: order.customer_address,
    items: order.items,
    total: order.total,
    status: order.status,
    whatsapp_sent: order.whatsapp_sent,
    notes: order.notes,
    created_at: order.created_at,
  };
}

export async function readOrders(): Promise<Order[]> {
  const { data, error } = await getClient()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to read orders: ${error.message}`);
  }

  return ((data ?? []) as OrderRow[]).map(rowToOrder);
}

export async function createOrder(input: {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total: number;
  notes: string;
  whatsapp_sent: boolean;
}): Promise<Order> {
  const order: Order = {
    id: randomUUID(),
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    customer_address: input.customer_address,
    items: input.items,
    total: input.total,
    status: "pending",
    whatsapp_sent: input.whatsapp_sent,
    notes: input.notes,
    created_at: new Date().toISOString(),
  };

  const row = orderToRow(order);
  const { data, error } = await getClient()
    .from("orders")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  return rowToOrder(data as OrderRow);
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
): Promise<Order | null> {
  const { data, error } = await getClient()
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }

  return data ? rowToOrder(data as OrderRow) : null;
}

export async function findOrdersByPhone(phone: string): Promise<Order[]> {
  const orders = await readOrders();
  return orders.filter((order) => phonesMatch(order.customer_phone, phone));
}

export async function findOrdersByIds(ids: string[]): Promise<Order[]> {
  if (ids.length === 0) return [];

  const { data, error } = await getClient()
    .from("orders")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to find orders by ids: ${error.message}`);
  }

  return ((data ?? []) as OrderRow[]).map(rowToOrder);
}
