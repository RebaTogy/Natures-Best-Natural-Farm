"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addToCart } from "./cart";

export async function toggleWishlist(productId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return { success: true, wished: false };
  }

  await prisma.wishlist.create({ data: { userId: user.id, productId } });
  return { success: true, wished: true };
}

export async function reorder(orderId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { orderItems: true },
  });
  if (!order) return { success: false, error: "Order not found." };

  for (const item of order.orderItems) {
    await addToCart(item.batchId, item.quantity);
  }

  return { success: true };
}
