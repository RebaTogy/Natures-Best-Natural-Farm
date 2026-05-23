import Link from "next/link";
import BlurBackground from "@/components/ui/BlurBackground";
import { prisma } from "@/lib/prisma";

interface TracePageProps {
  searchParams: Promise<{ batch?: string }>;
}

export default async function TracePage({ searchParams }: TracePageProps) {
  const { batch: batchCode } = await searchParams;
  const batch = batchCode
    ? await prisma.batch.findFirst({
        where: { OR: [{ id: batchCode }, { trackingCode: batchCode }] },
        include: {
          product: { include: { farmer: true } },
          traceabilityStages: { where: { isPublic: true }, orderBy: { stageOrder: "asc" } },
        },
      })
    : null;

  const traceUrl = batch ? `/trace?batch=${batch.trackingCode || batch.id}` : "";

  return (
    <BlurBackground className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-farm-green-800/10 pb-6">
        <span className="text-2xs uppercase tracking-widest font-semibold text-farm-gold-600">Public Traceability</span>
        <h1 className="font-serif text-4xl font-bold text-farm-green-950">Batch Lookup</h1>
      </div>

      <form className="rounded-3xl bg-farm-cream-50 p-6 border border-farm-green-900/5 flex flex-col sm:flex-row gap-3">
        <input
          name="batch"
          defaultValue={batchCode || ""}
          placeholder="Enter batch ID or tracking code"
          className="flex-1 rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:outline-none"
        />
        <button className="rounded-full bg-farm-green-900 px-6 py-3 text-xs font-semibold tracking-wider text-farm-cream-100 hover:bg-farm-gold-600">
          View Trace
        </button>
      </form>

      {batch && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-3xl bg-farm-cream-50 p-6 border border-farm-green-900/5">
            <p className="text-[10px] uppercase tracking-widest text-farm-gold-600 font-semibold">Batch #{batch.id.substring(0, 8)}</p>
            <h2 className="font-serif text-2xl font-bold text-farm-green-950 mt-1">{batch.product.name}</h2>
            <p className="text-sm text-farm-green-700 mt-1">Cultivated by {batch.product.farmer.name}</p>
            <div className="mt-6 space-y-4">
              {batch.traceabilityStages.map((stage) => (
                <div key={stage.id} className="rounded-2xl bg-farm-cream-100 p-4">
                  <p className="font-bold text-sm text-farm-green-950">{stage.stageName}</p>
                  <p className="mt-1 text-xs text-farm-green-800">{stage.description}</p>
                </div>
              ))}
            </div>
          </section>
          <aside className="rounded-3xl bg-farm-cream-50 p-6 border border-farm-green-900/5">
            <h3 className="font-serif text-lg font-bold text-farm-green-950">QR Link</h3>
            <div className="mt-4 aspect-square rounded-2xl border border-farm-green-900/10 bg-white p-4 grid place-items-center text-center text-xs font-mono text-farm-green-950 break-all">
              {traceUrl}
            </div>
            <p className="mt-3 text-xs text-farm-green-700">Use this stable URL payload with any QR generator for packaging labels.</p>
            <Link href={`/product/${batch.product.id}`} className="mt-5 inline-flex rounded-full bg-farm-green-900 px-5 py-2.5 text-xs font-semibold text-farm-cream-100">
              View Product
            </Link>
          </aside>
        </div>
      )}
    </BlurBackground>
  );
}
