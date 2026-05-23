"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Helper to get or create a session ID
export async function getOrCreateSessionId(createIfMissing = false): Promise<string | null> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("nbf_session")?.value;

  if (!sessionId && createIfMissing) {
    sessionId = typeof crypto !== "undefined" && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Set cookie for 30 days (ONLY allowed in server actions / route handlers)
    cookieStore.set("nbf_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
  }

  return sessionId || null;
}

export async function getCart() {
  try {
    const sessionId = await getOrCreateSessionId(false);
    if (!sessionId) return [];

    const items = await prisma.cartItem.findMany({
      where: { sessionId },
      include: {
        batch: {
          include: {
            product: {
              include: {
                farmer: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return items;
  } catch (error) {
    console.error("Failed to get cart:", error);
    return [];
  }
}

export async function addToCart(batchId: string, quantity: number) {
  try {
    const sessionId = await getOrCreateSessionId(true);
    if (!sessionId) throw new Error("Failed to create session");

    // Check batch and inventory
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    if (batch.status === "SOLD_OUT" || batch.remainingQuantity <= 0) {
      return { success: false, error: "This harvest batch is sold out" };
    }

    // Keep one active purchasable batch at a time. Saved items remain untouched.
    await prisma.cartItem.updateMany({
      where: {
        sessionId,
        savedForLater: false,
        NOT: { batchId },
      },
      data: { savedForLater: true },
    });

    // Check existing item in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        sessionId_batchId: {
          sessionId,
          batchId,
        },
      },
    });

    const targetQuantity = (existingItem?.quantity || 0) + quantity;

    if (targetQuantity > batch.remainingQuantity) {
      return {
        success: false,
        error: `Only ${batch.remainingQuantity} kg remaining in this harvest. You cannot add more than this to your cart.`,
      };
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: targetQuantity, savedForLater: false },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          sessionId,
          batchId,
          quantity,
          savedForLater: false,
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to add to cart:", error);
    return { success: false, error: error.message || "Failed to add item to cart" };
  }
}

export async function toggleSaveForLater(cartItemId: string, savedForLater: boolean) {
  try {
    const sessionId = await getOrCreateSessionId(false);
    if (!sessionId) return { success: false, error: "No active cart session." };

    if (!savedForLater) {
      const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
      if (!item) return { success: false, error: "Cart item not found" };
      await prisma.cartItem.updateMany({
        where: {
          sessionId,
          savedForLater: false,
          NOT: { id: cartItemId },
        },
        data: { savedForLater: true },
      });
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { savedForLater },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update saved state:", error);
    return { success: false, error: error.message || "Failed to update cart item" };
  }
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  try {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { batch: true },
    });

    if (!cartItem) {
      return { success: false, error: "Cart item not found" };
    }

    if (quantity > cartItem.batch.remainingQuantity) {
      return {
        success: false,
        error: `Only ${cartItem.batch.remainingQuantity} kg remaining in this harvest batch.`,
      };
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update cart quantity:", error);
    return { success: false, error: error.message || "Failed to update quantity" };
  }
}

export async function removeFromCart(cartItemId: string) {
  try {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to remove from cart:", error);
    return { success: false, error: error.message || "Failed to remove item" };
  }
}

export async function clearCart() {
  try {
    const sessionId = await getOrCreateSessionId(false);
    if (!sessionId) return { success: true };

    await prisma.cartItem.deleteMany({
      where: { sessionId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to clear cart:", error);
    return { success: false, error: error.message || "Failed to clear cart" };
  }
}
