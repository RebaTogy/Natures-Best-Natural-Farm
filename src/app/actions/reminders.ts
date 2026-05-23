"use server";

import { prisma } from "@/lib/prisma";

export async function queuePreBookPaymentReminders() {
  const now = new Date();
  const upcoming = await prisma.preBooking.findMany({
    where: {
      remainingAmount: { gt: 0 },
      status: { in: ["RESERVED", "HARVESTING", "PROCESSING", "READY"] },
      reminderDueAt: { lte: now },
    },
  });

  for (const booking of upcoming) {
    await prisma.notification.create({
      data: {
        event: "PREBOOK_PAYMENT_REMINDER",
        message: `Reminder: ${booking.currency} ${booking.remainingAmount.toFixed(2)} remains due for pre-booking #${booking.id.substring(0, 8)}.`,
        email: booking.customerEmail,
        type: "EMAIL",
        status: "PENDING",
      },
    });
    const next = new Date();
    next.setDate(next.getDate() + 7);
    await prisma.preBooking.update({ where: { id: booking.id }, data: { reminderDueAt: next } });
  }

  return { success: true, queued: upcoming.length };
}
