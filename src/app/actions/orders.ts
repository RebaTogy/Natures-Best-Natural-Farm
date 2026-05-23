"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId } from "./cart";
import { getCurrentUser } from "@/lib/auth";
import { calculateShipping, currencyForRegion, normalizeRegion } from "@/lib/commerce";
import { createOnlinePayment, statusForNewOrder } from "@/lib/payment";

export interface CheckoutInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: "COD" | "ONLINE";
  region?: string;
}

function nextReminderDate() {
  const date = new Date();
  date.setDate(date.getDate() + 21);
  return date;
}

export async function placeOrder(input: CheckoutInput) {
  try {
    const sessionId = await getOrCreateSessionId();
    if (!sessionId) throw new Error("No active session found.");

    const user = await getCurrentUser();
    const region = normalizeRegion(input.region);
    const currency = currencyForRegion(region);

    const result = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { sessionId, savedForLater: false },
        include: { batch: { include: { product: true } } },
      });

      if (cartItems.length === 0) throw new Error("Your active cart is empty.");

      for (const item of cartItems) {
        if (item.quantity > item.batch.remainingQuantity) {
          throw new Error(
            `Insufficient inventory for ${item.batch.product.name} (Batch ${item.batch.id.substring(0, 8)}). Available: ${item.batch.remainingQuantity}kg.`
          );
        }
      }

      const subtotalAmount = cartItems.reduce((sum, item) => sum + item.quantity * item.batch.price, 0);
      const shippingFee = calculateShipping(subtotalAmount, region);
      const totalAmount = subtotalAmount + shippingFee;

      const order = await tx.order.create({
        data: {
          userId: user?.id,
          subtotalAmount,
          shippingFee,
          totalAmount,
          currency,
          region,
          status: statusForNewOrder(input.paymentMethod),
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          paymentMethod: input.paymentMethod,
          isPreBookOrder: false,
        },
      });

      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            batchId: item.batchId,
            quantity: item.quantity,
            price: item.batch.price,
          },
        });

        const newRemaining = item.batch.remainingQuantity - item.quantity;
        await tx.batch.update({
          where: { id: item.batchId },
          data: {
            remainingQuantity: newRemaining,
            status: newRemaining <= 0 ? "SOLD_OUT" : item.batch.status,
          },
        });

        await tx.tracking.create({
          data: {
            orderId: order.id,
            batchId: item.batchId,
            status: "HARVEST",
            message: "Harvest allocation confirmed and awaiting fulfillment.",
          },
        });
      }

      const paymentIntent = await createOnlinePayment({
        amount: totalAmount,
        currency,
        referenceId: `retail-${order.id}`,
        kind: "ORDER",
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          currency,
          status: input.paymentMethod === "COD" ? "PENDING" : paymentIntent.status,
          type: "FULL",
          provider: input.paymentMethod === "COD" ? "COD" : paymentIntent.provider,
          checkoutUrl: input.paymentMethod === "COD" ? null : paymentIntent.checkoutUrl,
          transactionId: input.paymentMethod === "COD" ? `COD_${order.id}` : paymentIntent.transactionId,
        },
      });

      await tx.cartItem.deleteMany({ where: { sessionId, savedForLater: false } });

      await tx.analyticsLog.create({
        data: { eventType: "PURCHASE", sessionId, pageUrl: "/checkout" },
      });

      await tx.notification.create({
        data: {
          event: "ORDER_CREATED",
          message: `Order #${order.id.substring(0, 8)} created. Total: ${currency} ${totalAmount.toFixed(2)}. Status: ${order.status}`,
          email: order.customerEmail,
          type: "EMAIL",
          status: "PENDING",
        },
      });

      return order;
    });

    return { success: true, orderId: result.id };
  } catch (error: any) {
    console.error("Checkout failed:", error);
    return { success: false, error: error.message || "Failed to process order" };
  }
}

export interface PreBookInput extends CheckoutInput {
  batchId: string;
  quantity: number;
}

export async function createPreBooking(input: PreBookInput) {
  try {
    const sessionId = await getOrCreateSessionId();
    if (!sessionId) throw new Error("No active session found.");

    const user = await getCurrentUser();
    const region = normalizeRegion(input.region);
    const currency = currencyForRegion(region);

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: input.batchId },
        include: { product: true },
      });

      if (!batch) throw new Error("Harvest batch not found.");
      if (batch.status === "SOLD_OUT") throw new Error("This future harvest is already fully booked.");
      if (input.quantity > batch.remainingQuantity) {
        throw new Error(`Insufficient capacity left. Only ${batch.remainingQuantity}kg remaining for reservation.`);
      }

      const totalAmount = input.quantity * batch.price;
      const advancePaid = totalAmount * 0.3;
      const remainingAmount = totalAmount - advancePaid;

      const preBooking = await tx.preBooking.create({
        data: {
          userId: user?.id,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          currency,
          region,
          batchId: input.batchId,
          quantity: input.quantity,
          advancePaid,
          remainingAmount,
          reminderDueAt: nextReminderDate(),
          status: "RESERVED",
        },
      });

      const newRemaining = batch.remainingQuantity - input.quantity;
      await tx.batch.update({
        where: { id: input.batchId },
        data: { remainingQuantity: newRemaining, status: newRemaining <= 0 ? "SOLD_OUT" : batch.status },
      });

      const paymentIntent = await createOnlinePayment({
        amount: advancePaid,
        currency,
        referenceId: `prebook-${preBooking.id}`,
        kind: "PREBOOK_ADVANCE",
      });

      await tx.payment.create({
        data: {
          preBookingId: preBooking.id,
          amount: advancePaid,
          currency,
          status: input.paymentMethod === "COD" ? "PENDING" : paymentIntent.status,
          type: "ADVANCE",
          provider: input.paymentMethod === "COD" ? "COD" : paymentIntent.provider,
          checkoutUrl: input.paymentMethod === "COD" ? null : paymentIntent.checkoutUrl,
          transactionId: input.paymentMethod === "COD" ? `COD_ADV_${preBooking.id}` : paymentIntent.transactionId,
        },
      });

      await tx.tracking.create({
        data: {
          preBookingId: preBooking.id,
          batchId: batch.id,
          status: "HARVEST",
          message: "Reservation created. Crop lifecycle tracking is active.",
        },
      });

      await tx.analyticsLog.create({
        data: { eventType: "PREBOOK", sessionId, productId: batch.productId, batchId: batch.id, pageUrl: `/prebook/${batch.id}` },
      });

      await tx.notification.create({
        data: {
          event: "PREBOOK_CREATED",
          message: `Pre-booking #${preBooking.id.substring(0, 8)} created. Advance due/recorded: ${currency} ${advancePaid.toFixed(2)}.`,
          email: preBooking.customerEmail,
          type: "EMAIL",
          status: "PENDING",
        },
      });

      return preBooking;
    });

    return { success: true, preBookingId: result.id };
  } catch (error: any) {
    console.error("Pre-booking failed:", error);
    return { success: false, error: error.message || "Failed to create pre-booking" };
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            batch: {
              include: {
                product: { include: { farmer: true } },
                traceabilityStages: { orderBy: { stageOrder: "asc" } },
              },
            },
          },
        },
        payments: true,
        trackings: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) return null;
    const isUnlocked = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status);
    return { order, isUnlocked };
  } catch (error) {
    console.error("Failed to get order details:", error);
    return null;
  }
}

export async function getPreBookingDetails(preBookingId: string) {
  try {
    return prisma.preBooking.findUnique({
      where: { id: preBookingId },
      include: {
        batch: {
          include: {
            product: { include: { farmer: true } },
            traceabilityStages: { orderBy: { stageOrder: "asc" } },
          },
        },
        payments: true,
        trackings: { orderBy: { createdAt: "asc" } },
        refunds: true,
      },
    });
  } catch (error) {
    console.error("Failed to get pre-booking details:", error);
    return null;
  }
}

export async function payPreBookingBalance(preBookingId: string) {
  try {
    const preBooking = await prisma.preBooking.findUnique({ where: { id: preBookingId }, include: { batch: true } });
    if (!preBooking) return { success: false, error: "Pre-booking not found" };
    if (preBooking.remainingAmount <= 0) return { success: false, error: "Balance already paid." };

    const balanceAmount = preBooking.remainingAmount;
    const paymentIntent = await createOnlinePayment({
      amount: balanceAmount,
      currency: preBooking.currency,
      referenceId: `prebook-${preBooking.id}`,
      kind: "PREBOOK_BALANCE",
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          preBookingId,
          amount: balanceAmount,
          currency: preBooking.currency,
          status: paymentIntent.status,
          type: "FINAL",
          provider: paymentIntent.provider,
          checkoutUrl: paymentIntent.checkoutUrl,
          transactionId: paymentIntent.transactionId,
        },
      });

      await tx.preBooking.update({
        where: { id: preBookingId },
        data: { status: "COMPLETED", remainingAmount: 0 },
      });

      await tx.tracking.create({
        data: {
          preBookingId,
          batchId: preBooking.batchId,
          status: "PROCESSING",
          message: "Final balance recorded. Harvest is being prepared for shipping.",
        },
      });

      await tx.notification.create({
        data: {
          event: "PREBOOK_COMPLETED",
          message: `Final balance payment initiated for ${preBooking.currency} ${balanceAmount.toFixed(2)}.`,
          email: preBooking.customerEmail,
          type: "EMAIL",
          status: "PENDING",
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Paying balance failed:", error);
    return { success: false, error: error.message || "Failed to process balance payment" };
  }
}

export async function cancelPreBooking(preBookingId: string, reason = "Customer cancellation") {
  try {
    const preBooking = await prisma.preBooking.findUnique({ where: { id: preBookingId } });
    if (!preBooking) return { success: false, error: "Pre-booking not found" };
    if (["CANCELLED", "DELIVERED", "COMPLETED"].includes(preBooking.status)) {
      return { success: false, error: "This reservation cannot be cancelled." };
    }

    const refundAmount = preBooking.advancePaid;
    await prisma.$transaction(async (tx) => {
      await tx.preBooking.update({
        where: { id: preBookingId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.batch.update({
        where: { id: preBooking.batchId },
        data: { remainingQuantity: { increment: preBooking.quantity }, status: "PREBOOK" },
      });
      await tx.refund.create({
        data: {
          preBookingId,
          amount: refundAmount,
          currency: preBooking.currency,
          reason,
          status: "APPROVED",
        },
      });
      await tx.notification.create({
        data: {
          event: "PREBOOK_CANCELLED",
          message: `Pre-booking cancelled. Refund approved for ${preBooking.currency} ${refundAmount.toFixed(2)}.`,
          email: preBooking.customerEmail,
          type: "EMAIL",
          status: "PENDING",
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to cancel reservation" };
  }
}
