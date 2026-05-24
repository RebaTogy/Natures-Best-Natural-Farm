import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ImageWithFallback as Image } from "@/components/ImageWithFallback";
import { ArrowRight, Leaf, ShieldAlert, Award, CalendarDays, ShoppingCart } from "lucide-react";
import { logEvent } from "./actions/analytics";
import BlurBackground from "@/components/ui/BlurBackground";

export const revalidate = 60;

export default async function HomePage() {
  // Log homepage view event (simulated or quiet)
  // Fetch active batches for display
  const batches = await prisma.batch.findMany({
    include: {
      product: {
        include: {
          farmer: true,
        },
      },
    },
    orderBy: {
      harvestDate: "asc",
    },
    take: 3,
  });

  const farmers = await prisma.farmer.findMany({
    take: 3,
  });

  return (
    <>
      {/* 1. CINEMATIC HERO SECTION (PREMIUM GLASSMORPHISM) - NO BLUR */}
      <section className="relative h-screen min-h-[700px] w-full flex items-center justify-center overflow-hidden bg-farm-green-950">
        {/* Cinematic High-Res Background Image (Tropical Farm Sunrise) */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/media_hero.jpg"
            alt="Nature's Best Natural Farm Hero Background"
            fill
            className="object-cover object-center scale-105"
            unoptimized // Allow external URL without next.config changes
            priority
          />
          {/* Subtle cinematic anchor gradient to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* Premium Glassmorphism UI Overlay */}
        <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-start">
          {/* Center-left composition block */}
          <div className="max-w-xl p-10 sm:p-14 rounded-3xl bg-white/5 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-md relative overflow-hidden group">

            {/* Subtle refraction glow */}
            <div className="absolute -inset-24 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rotate-12 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-block text-[10px] sm:text-xs font-medium tracking-[0.2em] text-farm-cream-100 uppercase mb-4 opacity-80">
                Nature's Best Natural Farm
              </span>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] drop-shadow-sm mb-6">
                From Farm <br />
                <span className="italic font-light text-farm-cream-200">To Your Kitchen</span>
              </h1>

              <p className="text-sm sm:text-base text-farm-cream-100/80 leading-relaxed mb-10 font-light font-sans max-w-sm">
                A luxury digital farm ecosystem. Experience the organic harvest journey with absolute transparency, traceability, and batch-level ownership.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center rounded-full bg-white/90 px-8 py-3.5 text-xs font-semibold tracking-wider text-farm-green-950 shadow-lg hover:bg-white transition-all duration-300"
                >
                  Explore Harvests
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BODY SECTIONS WITH BLUR BACKGROUND - Sections 2-6 */}
      <BlurBackground className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative z-10 flex flex-col w-full">
          {/* 2. CORE VALUE PRINCIPLES */}
          <section className="relative z-10 pt-32 pb-28 bg-white/10 backdrop-blur-sm border-b border-farm-green-900/10 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-18">
                <h2 className="font-serif text-5xl sm:text-6xl font-bold text-farm-green-950 tracking-tight leading-tight">
                  A Direct Bond Built on Absolute Truth
                </h2>
                <p className="mt-6 text-lg sm:text-xl text-farm-green-800 leading-9 max-w-2xl mx-auto font-medium">
                  We separate each harvest into traceable, batch-level offerings so your kitchen knows exactly where every spoonful began. This is transparency you can see and trust.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Trust */}
                <div className="rounded-3xl bg-white shadow-sm border border-farm-green-900/10 p-8 hover-lift">
                  <div className="h-12 w-12 rounded-2xl bg-farm-green-900 flex items-center justify-center text-farm-cream-100 mb-5">
                    <Leaf className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-farm-green-950 mb-3">100% Raw Traceability</h3>
                  <p className="text-sm sm:text-base text-farm-green-800 leading-7">
                    Unlock batch timelines, lab reports, GPS crop maps, and temperature logs the moment you secure a harvest. No guessing, no blind packaging.
                  </p>
                </div>

                {/* Scarcity */}
                <div className="rounded-3xl bg-white shadow-sm border border-farm-green-900/10 p-8 hover-lift">
                  <div className="h-12 w-12 rounded-2xl bg-farm-green-900 flex items-center justify-center text-farm-cream-100 mb-5">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-farm-green-950 mb-3">Limited Harvest Batches</h3>
                  <p className="text-sm sm:text-base text-farm-green-800 leading-7">
                    Every harvest is finite. Live inventory updates show exactly how many kilograms remain for each soil plot and crop batch.
                  </p>
                </div>

                {/* Anticipation / Ownership */}
                <div className="rounded-3xl bg-white shadow-sm border border-farm-green-900/10 p-8 hover-lift">
                  <div className="h-12 w-12 rounded-2xl bg-farm-green-900 flex items-center justify-center text-farm-cream-100 mb-5">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-farm-green-950 mb-3">Pre-Booking Future Yields</h3>
                  <p className="text-sm sm:text-base text-farm-green-800 leading-7">
                    Reserve next season’s harvest before it lands. Fund growing operations directly and watch your selected crop develop stage by stage.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. FEATURED LIVE HARVESTS GRID */}
          <section className="relative z-10 py-28 bg-transparent">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                <div className="max-w-2xl">
                  <h2 className="font-serif text-4xl sm:text-5xl font-bold text-farm-green-950 tracking-tight leading-tight">
                    Active Harvest Batches
                  </h2>
                  <p className="mt-5 text-lg sm:text-xl text-farm-green-800 leading-9 font-medium">
                    Discover the freshest harvests currently drying, stored, or opening for pre-booking. Each batch is tied to a real farm, date, and harvest profile.
                  </p>
                </div>
                <Link
                  href="/marketplace"
                  className="mt-2 md:mt-0 group inline-flex items-center text-sm font-semibold text-farm-green-950 hover:text-farm-gold-600 transition-colors"
                >
                  View Full Marketplace
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {batches.map((batch) => {
                  const remainingPct = (batch.remainingQuantity / batch.totalQuantity) * 100;
                  const isLowStock = batch.remainingQuantity <= batch.totalQuantity * 0.25;

                  return (
                    <div key={batch.id} className="rounded-3xl overflow-hidden flex flex-col hover-lift group border border-farm-green-900/10 bg-white/10 backdrop-blur-sm shadow-sm">
                      {/* Image container */}
                      <div className="relative h-64 w-full overflow-hidden">
                        <Image
                          src={batch.product.mediaUrls.split(",")[0]}
                          alt={batch.product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-farm-green-950/65 to-transparent" />

                        {/* Batch Badge */}
                        <span className={`absolute top-4 left-4 rounded-full px-3.5 py-1 text-[10px] uppercase tracking-widest font-semibold text-farm-cream-100 ${batch.isFuture ? "bg-farm-gold-600" : "bg-farm-green-900"
                          }`}>
                          {batch.isFuture ? "Pre-Booking" : "In Stock"}
                        </span>

                        {/* Scarcity indicator overlay */}
                        {isLowStock && !batch.isFuture && batch.remainingQuantity > 0 && (
                          <span className="absolute bottom-4 right-4 rounded-full bg-red-800 px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-white animate-pulse">
                            Only {batch.remainingQuantity} kg left
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-7 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs text-farm-green-700 mb-4">
                            <span className="font-semibold uppercase tracking-wider">{batch.product.category}</span>
                            <span>Harvested {new Date(batch.harvestDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                          </div>

                          <h3 className="font-serif text-2xl font-bold text-farm-green-950 group-hover:text-farm-gold-600 transition-colors mb-4">
                            {batch.product.name}
                          </h3>

                          <p className="text-sm sm:text-base text-farm-green-800 leading-7 font-medium mb-6 line-clamp-3">
                            {batch.product.description}
                          </p>

                          {/* Farmer info */}
                          <div className="flex items-center space-x-3 mb-6 p-3 rounded-2xl bg-farm-cream-100 border border-farm-green-900/10">
                            <div className="relative h-10 w-10 rounded-full overflow-hidden">
                              <Image
                                src={batch.product.farmer.avatarUrl || "/images/avatar_liam.jpg"}
                                alt={batch.product.farmer.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-farm-green-700 font-semibold">Cultivated by</p>
                              <p className="text-sm font-semibold text-farm-green-950">{batch.product.farmer.name}</p>
                            </div>
                          </div>
                        </div>

                        {/* Footer / Pricing details */}
                        <div className="border-t border-farm-green-900/10 pt-4 flex items-center justify-between mt-auto gap-4">
                          <div>
                            <p className="text-[10px] text-farm-green-700 uppercase tracking-widest">Pricing</p>
                            <p className="text-sm font-semibold text-farm-green-950 italic">Select batch to view</p>
                          </div>
                          <Link
                            href={`/product/${batch.productId}`}
                            className="rounded-full bg-farm-green-900 hover:bg-farm-gold-600 text-farm-cream-100 px-5 py-2 text-xs font-semibold tracking-wider transition-colors duration-300"
                          >
                            Inspect Crop
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. FARMER EDITORIAL DIRECTORY */}
          <section className="relative z-10 py-28 bg-transparent">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-farm-gold-600">The Keepers of the Land</span>
                <h2 className="font-serif text-5xl sm:text-6xl font-bold text-farm-green-950 tracking-tight mt-2 leading-tight">
                  Meet Our Artisan Farmers
                </h2>
                <p className="mt-5 text-lg sm:text-xl text-farm-green-800 leading-9 max-w-2xl mx-auto font-medium">
                  Meet the growers behind every harvest. Each farm is chosen for soil health, craftsmanship, and a commitment to truly transparent production.
                </p>
              </div>

              <div className="space-y-16">
                {farmers.map((farmer, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div
                      key={farmer.id}
                      className={`flex flex-col lg:flex-row items-center gap-10 p-8 rounded-3xl bg-white/10 backdrop-blur-sm border border-farm-green-900/10 shadow-sm ${isEven ? "" : "lg:flex-row-reverse"
                        }`}
                    >
                      {/* Photo */}
                      <div className="relative h-96 w-full lg:w-1/2 rounded-3xl overflow-hidden shadow-lg">
                        <Image
                          src={farmer.mediaUrls}
                          alt={farmer.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-700"
                        />
                      </div>

                      {/* Story text */}
                      <div className="w-full lg:w-1/2 flex flex-col justify-center">
                        <span className="text-xs uppercase tracking-[0.24em] font-semibold text-farm-gold-600">
                          {farmer.location}
                        </span>
                        <h3 className="font-serif text-3xl sm:text-4xl font-bold text-farm-green-950 mt-3 mb-5">
                          {farmer.name}
                        </h3>
                        <p className="text-base sm:text-lg text-farm-green-800 leading-8 font-medium mb-6">
                          {farmer.story}
                        </p>
                        <div className="flex items-center">
                          <Link
                            href={`/farmer/${farmer.id}`}
                            className="inline-flex items-center justify-center rounded-full bg-farm-green-900 px-7 py-3 text-sm font-semibold tracking-[0.08em] text-farm-cream-100 hover:bg-farm-gold-600 transition-colors"
                          >
                            Read Full Story
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 5. PERSONALIZATION & ALERTS (Requirement 15) */}
          <section className="py-20 bg-farm-green-950 text-farm-cream-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div>
                  <h2 className="font-serif text-3xl font-bold mb-6">You Might Also Like</h2>
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-farm-green-900/40 border border-farm-green-800 flex items-center gap-6">
                      <div className="h-20 w-20 relative rounded-lg overflow-hidden shrink-0">
                        <Image src="/images/product_honey_1.jpg" alt="Honey" fill className="object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Wild Lavender Raw Honey</h3>
                        <p className="text-xs text-farm-cream-200 mt-1">Based on your interest in raw, organic pantry staples.</p>
                        <Link href="/marketplace" className="text-xs text-farm-gold-400 font-semibold mt-3 inline-block hover:text-farm-gold-300">Shop Similar Items &rarr;</Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="font-serif text-3xl font-bold mb-6">Next Harvest Alerts</h2>
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-farm-green-900/40 border border-farm-green-800">
                      <h3 className="font-bold text-lg text-farm-gold-400">Rainbow Carrots (Pre-Book)</h3>
                      <p className="text-xs text-farm-cream-200 mt-1 mb-4">Harvesting in 20 days by Marcus Vance. Secure your winter supply now before the batch is locked.</p>
                      <Link href="/marketplace" className="inline-flex items-center justify-center rounded-full bg-farm-cream-100 px-6 py-2.5 text-xs font-semibold tracking-wider text-farm-green-950 hover:bg-farm-gold-500 transition-colors">
                        Reserve Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. OUR LOCATION MAP SECTION */}
          <section id="map" className="relative z-10 py-24 bg-transparent border-t border-farm-green-800/10 scroll-mt-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-farm-gold-600 font-sans">Visit the Sanctuary</span>
                <h2 className="font-serif text-5xl sm:text-6xl font-bold text-farm-green-950 tracking-tight mt-2 leading-tight">
                  On Location
                </h2>
                <p className="mt-5 text-base sm:text-lg text-farm-green-800 leading-9 max-w-2xl mx-auto font-medium">
                  Deep in the nutrient-dense foothills of Oregon, our farm is where regenerative land stewardship and premium harvests meet. See where your batch begins.
                </p>
              </div>

              <div className="relative w-full h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-farm-green-900/10 bg-white/80 hover-lift transition-all duration-300">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d184496.06206132717!2d-123.1348888!3d44.0520694!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54c119b0ac50193d%3A0xf433537405be4f2!2sEugene%2C%20OR!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Nature's Best Natural Farm Location Map"
                  className="absolute inset-0 w-full h-full grayscale-[15%] contrast-[110%] saturate-[90%]"
                />
              </div>
            </div>
          </section>
        </div>
      </BlurBackground>
    </>
  );
}
