import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PreBookForm from "@/components/PreBookForm";
import BlurBackground from "@/components/ui/BlurBackground";
import { CalendarDays } from "lucide-react";

export const revalidate = 0; // Live inventory verification

interface PageProps {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ qty?: string }>;
}

export default async function PreBookPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const batchId = resolvedParams.batchId;
  const initialQty = parseInt(resolvedSearchParams.qty || "1") || 1;

  // Fetch Batch Details
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      product: {
        include: {
          farmer: true,
        },
      },
    },
  });

  if (!batch || !batch.isFuture) {
    return notFound();
  }

  return (
    <BlurBackground className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="border-b border-farm-green-800/10 pb-8 mb-10">
        <span className="text-2xs uppercase tracking-widest font-semibold text-farm-gold-600 flex items-center mb-1">
          <CalendarDays className="h-4 w-4 mr-1" />
          Pre-Harvest Guarantee Program
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-farm-green-900 tracking-tight">
          Reserve Your Winter Pantry
        </h1>
        <p className="mt-2 text-sm text-farm-green-700 font-sans font-light">
          Securing a crop pre-harvest directly supports the farmer&apos;s operations. Track progress through our event-based lifecycle below.
        </p>
      </div>

      <PreBookForm batch={batch} initialQuantity={initialQty} />
    </BlurBackground>
  );
}
