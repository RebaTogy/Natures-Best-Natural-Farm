import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ImageWithFallback as Image } from "@/components/ImageWithFallback";
import Link from "next/link";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import BlurBackground from "@/components/ui/BlurBackground";
import { MapPin, Award, CalendarDays } from "lucide-react";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FarmerProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  const farmerId = resolvedParams.id;

  // Fetch Farmer details
  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    include: {
      products: {
        include: {
          batches: {
            orderBy: { harvestDate: "asc" },
          },
        },
      },
    },
  });

  if (!farmer) {
    return notFound();
  }

  return (
    <BlurBackground className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <AnalyticsTracker eventType="STORY_ENGAGE" pageUrl={`/farmer/${farmerId}`} />
      {/* 1. EDITORIAL HEADER */}
      <div className="flex flex-col lg:flex-row items-center gap-12 border-b border-farm-green-800/10 pb-12 mb-16">
        
        {/* Photo Container */}
        <div className="relative h-96 w-full lg:w-1/2 rounded-3xl overflow-hidden shadow-md border border-farm-green-800/10">
          <Image
            src={farmer.mediaUrls.split(",")[0]}
            alt={farmer.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Profile Info */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 rounded-full bg-farm-gold-600/15 border border-farm-gold-500/20 px-3 py-1 text-2xs uppercase tracking-widest text-farm-gold-600 font-semibold">
              <Award className="h-3 w-3" />
              <span>Certified Source</span>
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-farm-green-950 tracking-tight">
            {farmer.name}
          </h1>

          <div className="flex items-center text-farm-green-700 text-sm italic font-sans">
            <MapPin className="h-4 w-4 mr-1.5" />
            {farmer.location}
          </div>

          <p className="text-farm-green-800 leading-relaxed font-sans font-light">
            {farmer.story}
          </p>
        </div>
      </div>

      {/* 2. CROP REGISTRY */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-farm-green-950 mb-8">
          Current & Future Harvests
        </h2>

        {farmer.products.length === 0 ? (
          <p className="text-sm text-farm-green-700">No active crops registered for this season.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {farmer.products.map((product) => {
              const activeBatchesCount = product.batches.filter((b) => b.remainingQuantity > 0).length;
              
              return (
                <div key={product.id} className="glass-panel overflow-hidden rounded-3xl hover-lift flex flex-col bg-farm-cream-50 border border-farm-green-900/5">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={product.mediaUrls.split(",")[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-farm-green-950/70 to-transparent" />
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-serif text-xl font-bold text-farm-green-950 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-farm-green-800 line-clamp-2 mb-4 flex-grow">
                      {product.description}
                    </p>
                    <Link
                      href={`/product/${product.id}`}
                      className="rounded-full bg-farm-green-900 hover:bg-farm-gold-600 text-farm-cream-100 px-6 py-2.5 text-xs font-semibold tracking-wider transition-colors duration-300 text-center w-full"
                    >
                      View Harvest Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BlurBackground>
  );
}
