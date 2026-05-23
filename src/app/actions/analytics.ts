"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getOrCreateSessionId } from "./cart";

// 1. Log an Analytics Event
export async function logEvent(eventType: string, data?: { productId?: string; batchId?: string; pageUrl?: string }) {
  try {
    const sessionId = (await getOrCreateSessionId(false)) || "anonymous";

    await prisma.analyticsLog.create({
      data: {
        eventType,
        sessionId,
        productId: data?.productId || null,
        batchId: data?.batchId || null,
        pageUrl: data?.pageUrl || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to log analytics event:", error);
    return { success: false };
  }
}

// 2. Get Analytics Summary for Dashboard
export async function getAnalyticsSummary() {
  try {
    const admin = await requireAdmin();
    if (!admin) throw new Error("Admin access required.");

    // Basic logs
    const logs = await prisma.analyticsLog.findMany();
    const orders = await prisma.order.findMany();
    const prebookings = await prisma.preBooking.findMany();

    const uniqueSessions = new Set(logs.map((l) => l.sessionId)).size || 1;

    // AOV
    const totalOrderAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const aov = orders.length > 0 ? totalOrderAmount / orders.length : 0;

    // Event counts
    const pageViews = logs.filter((l) => l.eventType === "PAGE_VIEW").length;
    const cartAdds = logs.filter((l) => l.eventType === "CART_ADD").length;
    const checkouts = logs.filter((l) => l.eventType === "CHECKOUT").length;
    const purchases = logs.filter((l) => l.eventType === "PURCHASE").length;
    const prebookEvents = logs.filter((l) => l.eventType === "PREBOOK").length;
    const storyEngagements = logs.filter((l) => l.eventType === "STORY_ENGAGE").length;

    // Conversion rate: successful transactions (purchases + pre-books) / unique sessions
    const totalConversions = orders.length + prebookings.length;
    const conversionRate = uniqueSessions > 0 ? (totalConversions / uniqueSessions) * 100 : 0;

    // Pre-booking rate
    const totalTransactions = orders.length + prebookings.length;
    const prebookPercentage = totalTransactions > 0 ? (prebookings.length / totalTransactions) * 100 : 0;

    // Checkout drop-off: checkouts that did not result in purchase/prebook
    const dropOffPercentage = checkouts > 0 ? ((checkouts - totalConversions) / checkouts) * 100 : 0;

    // Repeat purchase rate: customers with > 1 order
    const emailCounts: Record<string, number> = {};
    orders.forEach((o) => {
      emailCounts[o.customerEmail] = (emailCounts[o.customerEmail] || 0) + 1;
    });
    prebookings.forEach((pb) => {
      emailCounts[pb.customerEmail] = (emailCounts[pb.customerEmail] || 0) + 1;
    });

    const uniqueCustomers = Object.keys(emailCounts).length;
    const repeatCustomers = Object.values(emailCounts).filter((c) => c > 1).length;
    const repeatPurchaseRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

    // Popular Products views
    const products = await prisma.product.findMany({
      include: {
        farmer: true,
      },
    });

    const productViews = products.map((product) => {
      const views = logs.filter((l) => l.eventType === "PAGE_VIEW" && l.productId === product.id).length;
      const engagements = logs.filter((l) => l.eventType === "STORY_ENGAGE" && l.productId === product.id).length;
      return {
        id: product.id,
        name: product.name,
        farmerName: product.farmer.name,
        views,
        storyEngagement: engagements,
      };
    });

    return {
      uniqueSessions,
      pageViews,
      cartAdds,
      checkouts,
      purchases: orders.length,
      prebookings: prebookings.length,
      storyEngagements,
      aov,
      conversionRate,
      prebookPercentage,
      dropOffPercentage: Math.max(0, dropOffPercentage),
      repeatPurchaseRate,
      productViews,
    };
  } catch (error) {
    console.error("Failed to get analytics summary:", error);
    return null;
  }
}
