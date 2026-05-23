import BulkRequestForm from "@/components/BulkRequestForm";
import BlurBackground from "@/components/ui/BlurBackground";
import { Landmark, Mail, Phone } from "lucide-react";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

export const revalidate = 300;

export default async function BulkTradingPage() {

  return (
    <BlurBackground className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <AnalyticsTracker eventType="PAGE_VIEW" pageUrl="/bulk" />
      {/* Title */}
      <div className="border-b border-farm-green-800/10 pb-8 mb-16 bg-white/10 backdrop-blur-md rounded-[2rem] p-6">
        <span className="text-2xs uppercase tracking-widest font-semibold text-farm-gold-600 flex items-center mb-2">
          <Landmark className="h-4 w-4 mr-1 text-farm-gold-500" />
          Wholesale Commodity Division
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-farm-green-950 tracking-tight leading-tight">
          Institutional Volume Trading
        </h1>
        <p className="mt-4 text-base text-farm-green-950 font-sans font-medium leading-relaxed max-w-3xl">
          Simplify bulk trading with our platform—buy, sell, and manage premium grains, honey, and seasonal crops tailored for businesses worldwide.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Information details */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* Section 1 */}
          <div className="glass-panel p-8 rounded-3xl bg-white/50 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-4 transition-all hover:bg-white/60">
            <h2 className="font-serif text-3xl font-extrabold text-farm-green-950 tracking-tight drop-shadow-sm">
              Commercial Infrastructure
            </h2>
            <p className="text-base text-farm-green-950 font-sans font-medium leading-relaxed drop-shadow-sm">
              Nature&apos;s Best Natural Farm partners with regional bakeries and clean-label manufacturers to secure single-origin inputs. We operate custom clean-grain silos, temperature-stable warehouse pods, and dedicated logistics loops to maintain harvest identity.
            </p>
          </div>

          {/* Section 2: Guarantees */}
          <div className="glass-panel p-8 rounded-3xl bg-white/50 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6 transition-all hover:bg-white/60">
            <h3 className="font-serif text-2xl font-extrabold text-farm-green-950 tracking-tight drop-shadow-sm border-b border-farm-green-900/10 pb-4">
              Wholesale Service Guarantees
            </h3>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <span className="h-12 w-12 rounded-xl bg-farm-green-900 text-farm-cream-100 flex items-center justify-center shrink-0 shadow-md text-lg">
                  ✓
                </span>
                <div>
                  <h4 className="text-base font-bold text-farm-green-950 drop-shadow-sm mb-1.5">Lot-Specific Traceability Reporting</h4>
                  <p className="text-sm text-farm-green-950 font-sans font-medium leading-relaxed drop-shadow-sm">
                    Every bulk consignment includes full parcel soil indices, harvest date declarations, and logistics temperature graphs to support your brand&apos;s clean-label marketing.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <span className="h-12 w-12 rounded-xl bg-farm-green-900 text-farm-cream-100 flex items-center justify-center shrink-0 shadow-md text-lg">
                  ✓
                </span>
                <div>
                  <h4 className="text-base font-bold text-farm-green-950 drop-shadow-sm mb-1.5">Strict Purity Assays</h4>
                  <p className="text-sm text-farm-green-950 font-sans font-medium leading-relaxed drop-shadow-sm">
                    We certify 100% pesticide-free, organic non-GMO crops. Full lab chemistry certificates (heavy metals, gluten levels, water content) are provided prior to lot dispatch.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <span className="h-12 w-12 rounded-xl bg-farm-green-900 text-farm-cream-100 flex items-center justify-center shrink-0 shadow-md text-lg">
                  ✓
                </span>
                <div>
                  <h4 className="text-base font-bold text-farm-green-950 drop-shadow-sm mb-1.5">Hedging and Pre-Harvest Booking</h4>
                  <p className="text-sm text-farm-green-950 font-sans font-medium leading-relaxed drop-shadow-sm">
                    Stabilize raw material procurement costs. Lock in crop allocations 6-12 months ahead of seeding with flexible volume reservation contract terms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Contact */}
          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-farm-green-900/10 shadow-sm text-sm text-farm-green-950 space-y-3 transition-all hover:bg-white/80">
            <h4 className="font-serif text-lg font-extrabold text-farm-green-950 drop-shadow-sm">Wholesale Advisory Desk</h4>
            <p className="font-medium leading-relaxed drop-shadow-sm text-farm-green-900">Speak directly to an agricultural marketing advisor regarding contract drafting, container load packing, or custom packaging specifications.</p>
            <div className="flex flex-col sm:flex-row sm:space-x-6 pt-3 border-t border-farm-green-900/10 gap-y-2 sm:gap-y-0">
              <span className="flex items-center font-bold text-farm-green-950"><Mail className="h-4 w-4 mr-2 text-farm-gold-600" /> b2b@naturesbestfarm.com</span>
              <span className="flex items-center font-bold text-farm-green-950"><Phone className="h-4 w-4 mr-2 text-farm-gold-600" /> +1 (541) 555-0900</span>
            </div>
          </div>

        </div>

        {/* Right Column: Quote Requisition Form */}
        <div className="lg:col-span-6">
          <BulkRequestForm />
        </div>
      </div>
    </BlurBackground>
  );
}
