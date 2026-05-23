"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

async function assertAdmin() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Admin access required.");
  return admin;
}

async function logAdminActivity(action: string, detail: string) {
  const admin = await requireAdmin();
  if (!admin) return;

  await prisma.notification.create({
    data: {
      event: `ADMIN_${action}`,
      message: detail,
      email: admin.email,
      type: "ALERT",
      status: "SENT",
    },
  });
}

// 1. Get stats for Admin Dashboard
export async function getAdminStats() {
  try {
    await assertAdmin();
    const totalProducts = await prisma.product.count();
    const totalBatches = await prisma.batch.count();
    const totalOrders = await prisma.order.count();
    const totalPrebookings = await prisma.preBooking.count();
    const totalBulkRequests = await prisma.bulkRequest.count();
    const totalUsers = await prisma.user.count();

    const orders = await prisma.order.findMany();
    const prebookings = await prisma.preBooking.findMany();
    const payments = await prisma.payment.findMany({ where: { status: "SUCCESS" } });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalProducts,
      totalBatches,
      totalOrders,
      totalPrebookings,
      totalBulkRequests,
      totalUsers,
      totalRevenue,
    };
  } catch (error) {
    console.error("Admin stats failed:", error);
    return {
      totalProducts: 0,
      totalBatches: 0,
      totalOrders: 0,
      totalPrebookings: 0,
      totalBulkRequests: 0,
      totalUsers: 0,
      totalRevenue: 0,
    };
  }
}

// 2. Manage Batches (Update Pricing / Inventory / Future Status)
export async function updateBatch(batchId: string, data: { price?: number; remainingQuantity?: number; status?: string }) {
  try {
    await assertAdmin();
    const updated = await prisma.batch.update({
      where: { id: batchId },
      data,
    });
    revalidatePath("/marketplace");
    revalidatePath(`/product/${updated.productId}`);
    await logAdminActivity("BATCH_UPDATED", `Updated batch #${batchId.substring(0, 8)}.`);
    return { success: true, batch: updated };
  } catch (error: any) {
    console.error("Failed to update batch:", error);
    return { success: false, error: error.message };
  }
}

// 3. Create a New Batch Manually
export async function createBatch(data: {
  productId: string;
  harvestDate: string;
  totalQuantity: number;
  price: number;
  status: string;
  isFuture: boolean;
}) {
  try {
    await assertAdmin();
    const batch = await prisma.batch.create({
      data: {
        productId: data.productId,
        harvestDate: new Date(data.harvestDate),
        totalQuantity: Number(data.totalQuantity),
        remainingQuantity: Number(data.totalQuantity),
        price: Number(data.price),
        status: data.status,
        isFuture: data.isFuture,
      },
    });

    // Seed default traceability stages based on status
    if (data.isFuture) {
      await prisma.traceabilityStage.createMany({
        data: [
          { batchId: batch.id, stageOrder: 1, stageName: "Seed Selection", status: "COMPLETED", description: "Selected certified organic non-GMO seeds." },
          { batchId: batch.id, stageOrder: 2, stageName: "Sprouting", status: "ACTIVE", description: "Crops are sprouting and soil moisture levels are monitored." },
          { batchId: batch.id, stageOrder: 3, stageName: "Harvesting", status: "LOCKED", description: "Awaiting crop maturation." },
        ],
      });
    } else {
      await prisma.traceabilityStage.createMany({
        data: [
          { batchId: batch.id, stageOrder: 1, stageName: "Soil Preparation", status: "COMPLETED", description: "Organic compost mixed, soil composition analyzed." },
          { batchId: batch.id, stageOrder: 2, stageName: "Harvest", status: "COMPLETED", description: "Harvested manually at perfect ripeness." },
          { batchId: batch.id, stageOrder: 3, stageName: "Lab testing", status: "COMPLETED", description: "Tested pesticide-free, high nutritional composition." },
          { batchId: batch.id, stageOrder: 4, stageName: "Delivery", status: "ACTIVE", description: "En route to processing center." },
        ],
      });
    }

    revalidatePath("/marketplace");
    revalidatePath(`/product/${data.productId}`);
    await logAdminActivity("BATCH_CREATED", `Created harvest batch #${batch.id.substring(0, 8)}.`);
    return { success: true, batch };
  } catch (error: any) {
    console.error("Failed to create batch:", error);
    return { success: false, error: error.message };
  }
}

// 4. Update Order Status
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    await assertAdmin();
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Dispatch system notification
    await prisma.notification.create({
      data: {
        event: "ORDER_STATUS_UPDATED",
        message: `Your Order #${orderId.substring(0, 8)} status is now: ${status}`,
        email: updated.customerEmail,
        type: "EMAIL",
      },
    });

    await prisma.tracking.create({
      data: {
        orderId,
        status,
        message: `Order moved to ${status}.`,
      },
    });

    revalidatePath(`/order/${orderId}`);
    await logAdminActivity("ORDER_STATUS_UPDATED", `Set order #${orderId.substring(0, 8)} to ${status}.`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    return { success: false, error: error.message };
  }
}

// 5. Advance Pre-booking stages and update batch traceability stages
export async function advancePreBookingStage(preBookingId: string, currentStatus: string) {
  try {
    await assertAdmin();
    // Flow: RESERVED -> HARVESTING -> PROCESSING -> READY -> DELIVERED
    const stages = ["RESERVED", "HARVESTING", "PROCESSING", "READY", "DELIVERED"];
    const currentIndex = stages.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      return { success: false, error: "Cannot advance stage further." };
    }

    const nextStatus = stages[currentIndex + 1];

    const updated = await prisma.preBooking.update({
      where: { id: preBookingId },
      data: { status: nextStatus },
      include: { batch: true },
    });

    // Also update/advance the corresponding batch's traceability stages
    const traceabilityStages = await prisma.traceabilityStage.findMany({
      where: { batchId: updated.batchId },
      orderBy: { stageOrder: "asc" },
    });

    // Match stage orders: stage 1 matches RESERVED (seed selection), stage 2 matches HARVESTING, stage 3 matches PROCESSING, stage 4 matches READY
    const stageMap: Record<string, number> = {
      RESERVED: 1,
      HARVESTING: 2,
      PROCESSING: 3,
      READY: 4,
      DELIVERED: 5,
    };

    const targetStageOrder = stageMap[nextStatus];
    if (targetStageOrder) {
      // Mark current stage completed and next active
      for (const stage of traceabilityStages) {
        if (stage.stageOrder < targetStageOrder) {
          await prisma.traceabilityStage.update({
            where: { id: stage.id },
            data: { status: "COMPLETED" },
          });
        } else if (stage.stageOrder === targetStageOrder) {
          await prisma.traceabilityStage.update({
            where: { id: stage.id },
            data: { status: "ACTIVE" },
          });
        }
      }
    }

    // Create notification
    await prisma.notification.create({
      data: {
        event: "PREBOOK_STAGE_UPDATED",
        message: `Your pre-booked harvest is progressing! Current phase: ${nextStatus}.`,
        email: updated.customerEmail,
        type: "EMAIL",
      },
    });

    revalidatePath(`/order/${preBookingId}`);
    await logAdminActivity("PREBOOK_ADVANCED", `Advanced pre-booking #${preBookingId.substring(0, 8)} to ${nextStatus}.`);
    return { success: true, nextStatus };
  } catch (error: any) {
    console.error("Failed to advance prebooking stage:", error);
    return { success: false, error: error.message };
  }
}

// 6. Respond to B2B bulk request
export async function respondToBulkRequest(requestId: string, quoteStatus: "RESPONDED" | "COMPLETED") {
  try {
    await assertAdmin();
    const request = await prisma.bulkRequest.update({
      where: { id: requestId },
      data: { status: quoteStatus },
    });

    // Notify bulk client
    await prisma.notification.create({
      data: {
        event: "BULK_QUOTE_RESPONDED",
        message: `Your wholesale quote request for ${request.productInterest} has been responded to by Nature's Best Farm sales desk.`,
        email: request.email,
        type: "EMAIL",
      },
    });

    await logAdminActivity("BULK_REQUEST_RESPONDED", `Set bulk request #${requestId.substring(0, 8)} to ${quoteStatus}.`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update bulk request status:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBulkRequestStatus(
  requestId: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESPONDED" | "COMPLETED",
) {
  try {
    await assertAdmin();
    const request = await prisma.bulkRequest.update({
      where: { id: requestId },
      data: { status },
    });

    await prisma.notification.create({
      data: {
        event: "BULK_REQUEST_STATUS_UPDATED",
        message: `Your bulk trade request for ${request.productInterest} is now ${status}.`,
        email: request.email,
        type: "EMAIL",
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin-hub");
    await logAdminActivity("BULK_REQUEST_UPDATED", `Set bulk request #${requestId.substring(0, 8)} to ${status}.`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update bulk request status:", error);
    return { success: false, error: error.message };
  }
}

// 7. Get All Data for Admin Grid Tables
export async function getAdminGrids() {
  try {
    await assertAdmin();
    const products = await prisma.product.findMany({ include: { farmer: true, batches: true } });
    const farmers = await prisma.farmer.findMany({ orderBy: { createdAt: "desc" } });
    const batches = await prisma.batch.findMany({ include: { product: true } });
    const orders = await prisma.order.findMany({ include: { orderItems: true } } as any); // fallback type
    const prebookings = await prisma.preBooking.findMany({ include: { batch: { include: { product: true } } } });
    const bulkRequests = await prisma.bulkRequest.findMany({ orderBy: { createdAt: "desc" } });
    const notifications = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const serializedUsers = users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    }));

    const ordersFull = await prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            batch: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      products,
      farmers,
      batches,
      orders: ordersFull,
      prebookings,
      bulkRequests,
      notifications,
      users: serializedUsers,
    };
  } catch (error) {
    console.error("Failed to load admin grids:", error);
    return {
      products: [],
      farmers: [],
      batches: [],
      orders: [],
      prebookings: [],
      bulkRequests: [],
      notifications: [],
      users: [],
    };
  }
}

// 8. Create Product
export async function createProduct(data: {
  name: string;
  description: string;
  category: string;
  farmerId: string;
  mediaUrls: string;
  videoUrl?: string;
  initialHarvestDate?: string;
  initialQuantity?: number;
  initialPrice?: number;
  initialStatus?: string;
}) {
  try {
    await assertAdmin();
    const { initialHarvestDate, initialQuantity, initialPrice, initialStatus, ...productData } = data;
    const product = await prisma.product.create({
      data: productData,
    });

    if (initialHarvestDate && initialQuantity && initialPrice) {
      await prisma.batch.create({
        data: {
          productId: product.id,
          harvestDate: new Date(initialHarvestDate),
          totalQuantity: Number(initialQuantity),
          remainingQuantity: Number(initialQuantity),
          price: Number(initialPrice),
          status: initialStatus || "AVAILABLE",
          isFuture: initialStatus === "PREBOOK",
        },
      });
    }

    revalidatePath("/marketplace");
    revalidatePath("/admin");
    revalidatePath("/admin-hub");
    await logAdminActivity("PRODUCT_CREATED", `Created product ${product.name}.`);
    return { success: true, product };
  } catch (error: any) {
    console.error("Failed to create product:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    farmerId?: string;
    mediaUrls?: string;
    videoUrl?: string;
  },
) {
  try {
    await assertAdmin();
    const product = await prisma.product.update({
      where: { id: productId },
      data,
    });
    revalidatePath("/marketplace");
    revalidatePath(`/product/${productId}`);
    revalidatePath("/admin");
    revalidatePath("/admin-hub");
    await logAdminActivity("PRODUCT_UPDATED", `Updated product ${product.name}.`);
    return { success: true, product };
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return { success: false, error: error.message || "Failed to update product" };
  }
}

export async function deleteProduct(productId: string) {
  try {
    await assertAdmin();
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/marketplace");
    revalidatePath("/admin");
    revalidatePath("/admin-hub");
    await logAdminActivity("PRODUCT_DELETED", `Deleted product #${productId.substring(0, 8)}.`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return { success: false, error: error.message || "Failed to delete product" };
  }
}

// 9. Reset seed data for demo utility
export async function resetDatabaseSeed() {
  try {
    await assertAdmin();
    // Dynamically import tsx runner or just execute the seed code
    // Since we already have seed.ts, let's just trigger seed via command or re-import main
    // For safety, let's run it via a child process or rewrite in server-side
    // Let's use simple child_process or just perform database seed logic directly here!
    // Seeding directly is much faster and cleaner!
    const { exec } = require("child_process");
    await new Promise((resolve, reject) => {
      exec("npx tsx prisma/seed.ts", (err: any, stdout: any, stderr: any) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });
    revalidatePath("/marketplace");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to reset database seed:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBatch(batchId: string) {
  try {
    await assertAdmin();
    await prisma.batch.delete({ where: { id: batchId } });
    revalidatePath("/marketplace");
    revalidatePath("/admin");
    revalidatePath("/admin-hub");
    await logAdminActivity("BATCH_DELETED", `Deleted batch #${batchId.substring(0, 8)}.`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete batch" };
  }
}

export async function updateUserAccount(userId: string, data: { role: "CUSTOMER" | "ADMIN" | "DISABLED" }) {
  try {
    const admin = await requireAdmin();
    if (!admin) throw new Error("Admin access required.");
    if (admin.id === userId && data.role !== "ADMIN") {
      return { success: false, error: "You cannot remove or disable your own admin access." };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: data.role },
      select: { id: true, name: true, email: true, role: true },
    });

    await prisma.notification.create({
      data: {
        event: "USER_ACCOUNT_UPDATED",
        message: `Account role updated to ${data.role}.`,
        email: user.email,
        type: "ALERT",
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin-hub");
    await logAdminActivity("USER_ACCOUNT_UPDATED", `Set ${user.email} to ${data.role}.`);
    return { success: true, user };
  } catch (error: any) {
    console.error("Failed to update user account:", error);
    return { success: false, error: error.message || "Failed to update user account" };
  }
}

export async function createFarmer(data: { name: string; location: string; story: string; mediaUrls: string; avatarUrl?: string; videoUrl?: string }) {
  try {
    await assertAdmin();
    const farmer = await prisma.farmer.create({ data });
    revalidatePath("/admin");
    return { success: true, farmer };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create farmer" };
  }
}

export async function updateFarmer(farmerId: string, data: { name?: string; location?: string; story?: string; mediaUrls?: string; avatarUrl?: string; videoUrl?: string }) {
  try {
    await assertAdmin();
    const farmer = await prisma.farmer.update({ where: { id: farmerId }, data });
    revalidatePath(`/farmer/${farmerId}`);
    revalidatePath("/admin");
    return { success: true, farmer };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update farmer" };
  }
}

export async function sendManualNotification(data: { email: string; message: string; type: "EMAIL" | "SMS" | "ALERT" }) {
  try {
    await assertAdmin();
    await prisma.notification.create({
      data: {
        event: "MANUAL_ADMIN_NOTIFICATION",
        email: data.email,
        message: data.message,
        type: data.type,
        status: "PENDING",
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to queue notification" };
  }
}

export async function runDynamicPricing() {
  try {
    await assertAdmin();
    const batches = await prisma.batch.findMany();
    for (const batch of batches) {
      const scarcity = batch.remainingQuantity / Math.max(batch.totalQuantity, 1);
      const harvestMonth = batch.harvestDate.getMonth();
      const seasonalMultiplier = harvestMonth >= 10 || harvestMonth <= 1 ? 1.08 : 1;
      const demandMultiplier = scarcity < 0.2 ? 1.15 : scarcity > 0.75 ? 0.96 : 1;
      await prisma.batch.update({
        where: { id: batch.id },
        data: { price: Math.max(0.5, Number((batch.price * seasonalMultiplier * demandMultiplier).toFixed(2))) },
      });
    }
    revalidatePath("/marketplace");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to run pricing engine" };
  }
}
