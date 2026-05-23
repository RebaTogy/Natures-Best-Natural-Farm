import Link from "next/link";
import { ImageWithFallback as Image } from "@/components/ImageWithFallback";

export default function Footer() {
  return (
    <footer className="relative w-full mt-auto overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/footer_bg.jpg"
          alt="Premium Farm Footer Background"
          fill
          className="object-cover object-center"
        />
        {/* Glassmorphism & Cinematic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-farm-green-950/95 via-farm-green-950/80 to-farm-green-950/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-farm-cream-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Farm Story */}
          <div className="col-span-1 md:col-span-2">
            <span className="text-3xl drop-shadow-md">🌿</span>
            <h3 className="font-serif text-2xl font-bold tracking-wide text-white mt-2 drop-shadow-sm">
              NATURE'S BEST NATURAL FARM
            </h3>
            <p className="mt-4 text-sm text-farm-cream-100/80 max-w-md leading-relaxed font-sans font-light">
              We connect food lovers directly with agricultural harvests, providing absolute transparency,
              batch-level tracking, and genuine storytelling from our fields to your kitchen.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-farm-gold-400 font-semibold mb-4 drop-shadow-sm">
              Explore
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/marketplace" className="text-farm-cream-100/80 hover:text-white transition-colors">
                  The Marketplace
                </Link>
              </li>
              <li>
                <Link href="/bulk" className="text-farm-cream-100/80 hover:text-white transition-colors">
                  Institutional Bulk Trading
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-farm-cream-100/80 hover:text-white transition-colors">
                  Farmer & Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-farm-gold-400 font-semibold mb-4 drop-shadow-sm">
              Direct Contact
            </h4>
            <p className="text-sm text-farm-cream-100/80 mb-2">
              Willow Creek Valley, OR
            </p>
            <p className="text-sm text-farm-cream-100/80">
              hello@naturesbestfarm.com
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-farm-cream-100/60">
          <p>© {new Date().getFullYear()} Nature's Best Natural Farm. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refunds</Link>
            <Link href="/cancellation-policy" className="hover:text-white transition-colors">Cancellations</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
