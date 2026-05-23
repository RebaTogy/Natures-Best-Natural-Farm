import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ImageWithFallback as Image } from "@/components/ImageWithFallback";
import { notFound } from "next/navigation";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import ProductInteractiveSection from "@/components/ProductInteractiveSection";
import BlurBackground from "@/components/ui/BlurBackground";
import { getDeliveryEstimate } from "@/lib/commerce";
import WishlistButton from "@/components/WishlistButton";
import { Leaf, Lock, ShieldCheck, MapPin, Truck, Star } from "lucide-react";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // 1. Fetch Product details
  let product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      farmer: true,
      reviews: {
        orderBy: { createdAt: "desc" },
      },
      batches: {
        orderBy: { harvestDate: "asc" },
      },
    },
  });

  if (!product) {
    // Attempt slug-based lookup for routes like /product/wild-lavender-raw-honey
    const allProducts = await prisma.product.findMany({
      include: {
        farmer: true,
        reviews: {
          orderBy: { createdAt: "desc" },
        },
        batches: {
          orderBy: { harvestDate: "asc" },
        },
      },
    });
    product = allProducts.find(p => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === productId.toLowerCase()) || null;
  }

  if (!product) {
    return notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      OR: [{ category: product.category }, { farmerId: product.farmerId }],
    },
    include: { farmer: true, batches: true },
    take: 3,
  });

  // Get a representative batch to show basic transparency preview
  const previewBatch = product.batches.find((b) => !b.isFuture) || product.batches[0];
  
  // Fetch default stages for preview batch
  const previewStages = previewBatch
    ? await prisma.traceabilityStage.findMany({
        where: { batchId: previewBatch.id },
        orderBy: { stageOrder: "asc" },
      })
    : [];

  return (
    <BlurBackground className="flex flex-col w-full">
      <AnalyticsTracker eventType="PAGE_VIEW" productId={product.id} />
      {/* 1. CINEMATIC VIDEO BACKGROUND HERO */}
      <section className="relative h-[65vh] min-h-[450px] w-full flex items-end overflow-hidden bg-farm-green-950">
        <div className="absolute inset-0 w-full h-full">
          {product.videoUrl ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src={product.videoUrl} type="video/mp4" />
            </video>
          ) : (
            <Image
              src={product.mediaUrls.split(",")[0]}
              alt={product.name}
              fill
              className="w-full h-full object-cover"
              priority
            />
          )}
          {/* Subtle bottom gradient to ensure text readability without obscuring the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl flex flex-col items-start space-y-4">
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-black/30 border border-white/20 px-3 py-1 text-2xs uppercase tracking-widest text-farm-cream-100 font-semibold backdrop-blur-md">
              <Leaf className="h-3.5 w-3.5 text-farm-gold-500" />
              <span>Certified Single-Origin {product.category}</span>
            </span>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-farm-cream-50 leading-[1.15]">
              {product.name}
            </h1>

            <div className="flex items-center space-x-3 text-farm-cream-200 text-xs">
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-farm-gold-500" />
                {product.farmer.location}
              </span>
              <span className="opacity-40">&bull;</span>
              <span>Cultivated by {product.farmer.name}</span>
            </div>
            <WishlistButton productId={product.id} />
          </div>
        </div>
      </section>

      {/* 2. BODY CONTENT: SPLIT GRID */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Product Info */}
            <div className="lg:col-span-7 space-y-12">
              <div className="relative z-10 bg-white/5 backdrop-blur-sm rounded-xl p-6">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-farm-green-950 border-b border-farm-green-800/10 pb-3 mb-4">
                  Harvest Profile & Story
                </h2>
                <p className="text-base text-farm-green-950 leading-relaxed font-sans font-medium whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Farmer Section */}
              <div className="p-8 rounded-3xl bg-white/6 backdrop-blur-sm border border-farm-green-900/8 relative z-10">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-farm-gold-600 font-sans block mb-2">
                  Meet the Grower
                </span>
                
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative h-20 w-20 rounded-full overflow-hidden shrink-0 border border-farm-green-800/10 shadow-sm">
                    <Image
                      src={product.farmer.avatarUrl || "/images/avatar_liam.jpg"}
                      alt={product.farmer.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-farm-green-950">
                      {product.farmer.name}
                    </h3>
                    <p className="text-sm text-farm-green-800 font-medium mt-1 mb-3 flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-farm-gold-500" />
                      {product.farmer.location}
                    </p>
                    <p className="text-sm text-farm-green-800 leading-relaxed font-sans font-medium line-clamp-4">
                      {product.farmer.story}
                    </p>
                    <Link
                      href={`/farmer/${product.farmer.id}`}
                      className="mt-4 inline-flex items-center text-xs font-semibold text-farm-green-900 hover:text-farm-gold-600 transition-colors"
                    >
                      Explore {product.farmer.name}&apos;s Profile
                      <Leaf className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Traceability PRE-PURCHASE Preview */}
              <div className="space-y-6 relative z-10 bg-white/6 backdrop-blur-sm rounded-xl p-6">
                <div className="flex justify-between items-center pb-3">
                  <h2 className="font-serif text-2xl font-bold text-farm-green-950">
                    Transparency & Traceability Preview
                  </h2>
                  <span className="text-[10px] uppercase bg-farm-green-900/10 text-farm-green-900 rounded-full px-2.5 py-1 font-semibold flex items-center">
                    <Lock className="h-3 w-3 mr-1" />
                    Partial View
                  </span>
                </div>
                <p className="text-sm text-farm-green-800 font-medium font-sans leading-relaxed">
                  We verify our farming stages at source. The initial soil and growth logs are transparent. Full lab reports unlock immediately post-purchase.
                </p>
                <div className="flow-root pl-4">
                  <ul className="-mb-8">
                    {previewStages.map((stage, idx) => {
                      const isLast = idx === previewStages.length - 1;
                      const isLocked = stage.stageOrder > 2;
                      return (
                        <li key={stage.id}>
                          <div className="relative pb-8">
                            {!isLast && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-farm-green-900/20" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-4">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-farm-cream-100 ${
                                  isLocked ? "bg-farm-cream-200 text-farm-green-600" : "bg-farm-green-900 text-farm-cream-100"
                                }`}>
                                  {isLocked ? <Lock className="h-3.5 w-3.5" /> : <ShieldCheck className="h-4 w-4" />}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className={`text-sm ${isLocked ? "text-farm-green-700 font-semibold" : "text-farm-green-950 font-bold"}`}>
                                    {stage.stageName} {isLocked && "(Locked)"}
                                  </p>
                                  <p className="text-sm text-farm-green-800 font-medium mt-1 max-w-lg leading-relaxed">
                                    {isLocked 
                                      ? "Secure this batch to unlock detailed laboratory scan results, certification stamps, and harvesting temperature graphs." 
                                      : stage.description}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-farm-green-700 font-mono">
                                  {stage.date && !isLocked ? new Date(stage.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "---"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

            </div>

            {/* Right Column: Dynamic Interactive Ordering Box */}
            <div className="lg:col-span-5">
              <div className="sticky top-28">
                <div className="mb-6 rounded-2xl border border-farm-green-900/10 bg-farm-cream-50 p-5 flex items-start gap-3">
                  <Truck className="h-5 w-5 text-farm-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-farm-green-700">
                      Estimated Delivery
                    </p>
                    <p className="text-sm font-bold text-farm-green-950">
                      {getDeliveryEstimate("US")} after allocation confirmation
                    </p>
                  </div>
                </div>
                <ProductInteractiveSection
                  productId={product.id}
                  productName={product.name}
                  batches={product.batches}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-serif text-2xl font-bold text-farm-green-950 border-b border-farm-green-800/10 pb-3 mb-5">
              Reviews & Testimonials
            </h2>
            {product.reviews.length === 0 ? (
              <p className="text-base text-farm-green-900 font-medium">No reviews yet for this harvest.</p>
            ) : (
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl bg-white/6 border border-farm-green-900/8 p-5 relative z-10">
                    <div className="flex items-center gap-2 text-farm-gold-600 mb-2">
                      {Array.from({ length: review.rating }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 text-farm-gold-600" />
                      ))}
                    </div>
                    <p className="text-base text-farm-green-900 font-medium leading-relaxed">{review.comment}</p>
                    <p className="mt-3 text-sm font-semibold text-farm-green-950">{review.authorName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-farm-green-900 border-b border-farm-green-800/10 pb-3 mb-5">
              Related Harvests
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedProducts.map((related) => (
                <Link key={related.id} href={`/product/${related.id}`} className="rounded-2xl bg-white/6 border border-farm-green-900/8 p-5 hover:border-farm-gold-600 transition-colors relative z-10">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-farm-gold-600">{related.category}</p>
                  <h3 className="mt-1 font-serif text-lg font-bold text-farm-green-950">{related.name}</h3>
                  <p className="mt-2 text-sm text-farm-green-800 font-medium">By {related.farmer.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </BlurBackground>
  );
}
