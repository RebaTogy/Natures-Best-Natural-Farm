import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ImageWithFallback as Image } from "@/components/ImageWithFallback";
import BlurBackground from "@/components/ui/BlurBackground";
import { Leaf, Info } from "lucide-react";

export const revalidate = 60;

interface SearchParams {
  category?: string;
  status?: string;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoryFilter = params.category;
  const statusFilter = params.status;

  // Build query
  const whereClause: { category?: string } = {};
  if (categoryFilter && categoryFilter !== "All") {
    whereClause.category = categoryFilter;
  }

  // Fetch products with their batches and farmers
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      farmer: true,
      batches: {
        orderBy: { harvestDate: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Apply status filtering in memory if needed
  let filteredProducts = products;
  if (statusFilter === "AVAILABLE") {
    filteredProducts = products.filter((p) => p.batches.some((b) => !b.isFuture && b.remainingQuantity > 0));
  } else if (statusFilter === "PREBOOK") {
    filteredProducts = products.filter((p) => p.batches.some((b) => b.isFuture));
  }

  // Fetch unique categories for filter tabs
  const allCategories = ["All", "Grains", "Honey", "Vegetables"];

  return (
    <BlurBackground className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-farm-green-800/10 pb-10 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text-2xs uppercase tracking-widest font-semibold text-farm-gold-600">The Granary & Larder</span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-farm-green-950 tracking-tight mt-1">
            Season Harvest Registry
          </h1>
          <p className="mt-4 text-base sm:text-lg text-farm-green-800 leading-8">
            Browse certified harvests, batch types, and planting origins at a glance. Choose a product first, then view its available soil plots and harvest dates.
          </p>
        </div>

        {/* Status quick filters */}
        <div className="flex space-x-2">
          <Link
            href="/marketplace"
            className={`rounded-full px-4 py-2 text-xs font-semibold border tracking-wider transition-all duration-300 ${
              !statusFilter
                ? "bg-farm-green-900 border-farm-green-900 text-farm-cream-100"
                : "bg-farm-cream-50 border-farm-green-900/10 text-farm-green-800 hover:border-farm-green-900/30"
            }`}
          >
            All Batches
          </Link>
          <Link
            href={`/marketplace?status=AVAILABLE${categoryFilter ? `&category=${categoryFilter}` : ""}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold border tracking-wider transition-all duration-300 ${
              statusFilter === "AVAILABLE"
                ? "bg-farm-green-900 border-farm-green-900 text-farm-cream-100"
                : "bg-farm-cream-50 border-farm-green-900/10 text-farm-green-800 hover:border-farm-green-900/30"
            }`}
          >
            In-Stock (Store)
          </Link>
          <Link
            href={`/marketplace?status=PREBOOK${categoryFilter ? `&category=${categoryFilter}` : ""}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold border tracking-wider transition-all duration-300 ${
              statusFilter === "PREBOOK"
                ? "bg-farm-green-900 border-farm-green-900 text-farm-cream-100"
                : "bg-farm-cream-50 border-farm-green-900/10 text-farm-green-800 hover:border-farm-green-900/30"
            }`}
          >
            Pre-Booking
          </Link>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex overflow-x-auto pb-4 mb-10 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none gap-3">
        {allCategories.map((cat) => (
          <Link
            key={cat}
            href={`/marketplace?category=${cat}${statusFilter ? `&status=${statusFilter}` : ""}`}
            className={`rounded-full px-6 py-3 text-xs font-semibold border transition-all duration-300 ${
              (categoryFilter || "All") === cat
                ? "bg-farm-green-900 border-farm-green-900 text-farm-cream-100"
                : "bg-farm-cream-50 border-farm-green-900/5 text-farm-green-800 hover:border-farm-green-900/20"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-farm-cream-50 rounded-3xl border border-dashed border-farm-green-800/15">
          <Leaf className="h-10 w-10 text-farm-green-600 mx-auto mb-4 animate-pulse" />
          <h3 className="font-serif text-lg font-bold text-farm-green-900">No Harvests Found</h3>
          <p className="text-sm text-farm-green-700 mt-2 font-light">
            Try adjusting your filtering queries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            // Check active retail/pre-book stocks
            const hasRetail = product.batches.some((b) => !b.isFuture && b.remainingQuantity > 0);
            const hasPrebook = product.batches.some((b) => b.isFuture && b.remainingQuantity > 0);
            const activeBatchesCount = product.batches.filter((b) => b.remainingQuantity > 0).length;

            // Get lowest remaining stock batch for scarcity warning
            const activeBatches = product.batches.filter((b) => b.remainingQuantity > 0 && !b.isFuture);
            const lowStockBatch = activeBatches.length > 0 
              ? activeBatches.reduce((min, b) => b.remainingQuantity < min.remainingQuantity ? b : min, activeBatches[0])
              : null;
            const isScarcity = lowStockBatch && lowStockBatch.remainingQuantity <= 50;

            return (
              <div key={product.id} className="rounded-3xl bg-white/10 overflow-hidden hover-lift flex flex-col border border-farm-green-900/10 shadow-sm backdrop-blur-sm">
                {/* Photo container */}
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={product.mediaUrls.split(",")[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-farm-green-950/70 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {hasRetail && (
                      <span className="rounded-full bg-farm-green-900 text-farm-cream-50 px-3.5 py-1 text-[10px] uppercase tracking-widest font-semibold">
                        In Stock
                      </span>
                    )}
                    {hasPrebook && (
                      <span className="rounded-full bg-farm-gold-600 text-farm-cream-50 px-3.5 py-1 text-[10px] uppercase tracking-widest font-semibold">
                        Pre-Booking Open
                      </span>
                    )}
                    {activeBatchesCount === 0 && (
                      <span className="rounded-full bg-red-900 text-white px-3.5 py-1 text-[10px] uppercase tracking-widest font-semibold">
                        Sold Out
                      </span>
                    )}
                  </div>

                  {/* Scarcity Overlay */}
                  {isScarcity && (
                    <span className="absolute bottom-4 right-4 rounded-full bg-red-800 px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-white animate-pulse">
                      Only {lowStockBatch.remainingQuantity} kg left
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-7 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs text-farm-green-700 mb-4">
                      <span className="font-semibold uppercase tracking-wider">{product.category}</span>
                      <span className="flex items-center gap-2 text-farm-green-700">
                        <Leaf className="h-3 w-3 text-farm-gold-500" />
                        {activeBatchesCount} {activeBatchesCount === 1 ? "Batch" : "Batches"}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-farm-green-950 mb-4">
                      {product.name}
                    </h3>

                    <p className="text-sm sm:text-base text-farm-green-800 leading-7 font-medium mb-6 line-clamp-3">
                      {product.description}
                    </p>

                    {/* Farmer */}
                    <div className="flex items-center space-x-3 mb-6 p-3 rounded-2xl bg-farm-cream-100 border border-farm-green-900/10">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden">
                        <Image
                          src={product.farmer.avatarUrl || "/images/avatar_liam.jpg"}
                          alt={product.farmer.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-farm-green-700 font-semibold">Cultivated by</p>
                        <Link href={`/farmer/${product.farmer.id}`} className="text-sm font-semibold text-farm-green-950 hover:text-farm-gold-600 transition-colors">
                          {product.farmer.name}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-farm-green-900/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-farm-green-700">
                      <Info className="h-3.5 w-3.5 text-farm-gold-600" />
                      <span>Select batch to view price</span>
                    </div>
                    <Link
                      href={`/product/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="rounded-full bg-farm-green-900 hover:bg-farm-gold-600 text-farm-cream-100 px-5 py-2.5 text-xs font-semibold tracking-wider transition-colors duration-300"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BlurBackground>
  );
}
