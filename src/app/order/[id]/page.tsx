import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ImageWithFallback as Image } from "@/components/ImageWithFallback";
import Link from "next/link";
import { getOrderDetails, getPreBookingDetails } from "@/app/actions/orders";
import PayBalanceButton from "@/components/PayBalanceButton";
import CancelPreBookButton from "@/components/CancelPreBookButton";
import BlurBackground from "@/components/ui/BlurBackground";
import {
  ShieldCheck,
  MapPin,
  CalendarDays,
  Truck,
  DollarSign,
  FileText,
  ThermometerSnowflake,
  Compass,
  ArrowRight,
  TrendingDown,
  Info
} from "lucide-react";

export const revalidate = 0; // Live status checks

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;

  let isPreBook = false;
  let orderData: any = null;
  let preBookData: any = null;

  if (rawId.startsWith("retail-")) {
    const orderId = rawId.replace("retail-", "");
    orderData = await getOrderDetails(orderId);
  } else if (rawId.startsWith("prebook-")) {
    const preBookId = rawId.replace("prebook-", "");
    preBookData = await getPreBookingDetails(preBookId);
    isPreBook = true;
  } else {
    // Attempt fallback checks
    orderData = await getOrderDetails(rawId);
    if (!orderData) {
      preBookData = await getPreBookingDetails(rawId);
      if (preBookData) isPreBook = true;
    }
  }

  if (!orderData && !preBookData) {
    return notFound();
  }

  // Common variables
  const customerName = isPreBook ? preBookData.customerName : orderData.order.customerName;
  const customerEmail = isPreBook ? preBookData.customerEmail : orderData.order.customerEmail;
  const shippingAddress = isPreBook ? preBookData.shippingAddress : orderData.order.shippingAddress;
  const trackingEvents = isPreBook ? preBookData.trackings || [] : orderData.order.trackings || [];
  const timeline = ["HARVEST", "PROCESSING", "SHIPPED", "DELIVERED"];
  
  return (
    <BlurBackground className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 pb-8 border-b border-farm-green-800/10">
        <span className="text-2xs uppercase tracking-widest font-semibold text-farm-gold-600 flex items-center mb-1">
          <FileText className="h-4 w-4 mr-1" />
          {isPreBook ? "Pre-Booking Ledger" : "Retail Fulfillment Ledger"}
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-farm-green-950 tracking-tight">
          Track Your Harvest
        </h1>
        <p className="mt-2 text-sm text-farm-green-700 font-sans font-light">
          Tracking ID: {rawId}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-farm-green-900 border-b border-farm-green-800/10 pb-2">
            Status & Traceability
          </h2>
          <div className="bg-farm-cream-50 p-6 rounded-2xl border border-farm-green-900/5">
             {isPreBook ? (
                <div>
                   <p className="text-sm font-bold mb-4">Current Stage: {preBookData.status}</p>
                   {preBookData.status === "READY" && (
                     <div className="mb-6 p-4 bg-farm-green-900/5 rounded-xl">
                       <p className="text-xs text-farm-green-800 mb-2">Harvest is ready! Pay the final balance to ship.</p>
                       <PayBalanceButton preBookingId={preBookData.id} balanceAmount={preBookData.remainingAmount || 0} />
                     </div>
                   )}
                   <p className="text-xs text-farm-green-800 font-light">Traceability timeline unlocked.</p>
                   {!["CANCELLED", "DELIVERED", "COMPLETED"].includes(preBookData.status) && (
                     <CancelPreBookButton preBookingId={preBookData.id} />
                   )}
                </div>
             ) : (
                <div>
                   <p className="text-sm font-bold mb-4">Order Status: {orderData.order.status}</p>
                   <div className="space-y-4">
                     <div className="flex items-center space-x-3 text-xs text-farm-green-700">
                       <MapPin className="h-4 w-4" /> <span>Origin coordinates mapped and verified.</span>
                     </div>
                     <div className="flex items-center space-x-3 text-xs text-farm-green-700">
                       <ThermometerSnowflake className="h-4 w-4" /> <span>Cold-chain integrity intact.</span>
                     </div>
                   </div>
                </div>
             )}
          </div>
          <div className="mt-6 bg-farm-cream-50 p-6 rounded-2xl border border-farm-green-900/5">
            <h3 className="font-serif text-lg font-bold text-farm-green-950 mb-4">Fulfillment Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {timeline.map((step) => {
                const reached = trackingEvents.some((event: any) => event.status === step) || (!isPreBook && orderData.order.status === step);
                return (
                  <div key={step} className={`rounded-2xl border p-4 text-center ${reached ? "bg-farm-green-900 text-farm-cream-50 border-farm-green-900" : "bg-farm-cream-100 text-farm-green-700 border-farm-green-900/10"}`}>
                    <p className="text-[10px] font-bold tracking-wider">{step}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-2">
              {trackingEvents.map((event: any) => (
                <p key={event.id} className="text-xs text-farm-green-800">
                  <strong>{event.status}:</strong> {event.message}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <h2 className="font-serif text-2xl font-bold text-farm-green-900 border-b border-farm-green-800/10 pb-2">
            Ledger Details
           </h2>
           <div className="bg-farm-cream-50 p-6 rounded-2xl border border-farm-green-900/5 text-sm space-y-2 text-farm-green-800 font-light">
             <p><strong>Billed To:</strong> {customerName}</p>
             <p><strong>Email:</strong> {customerEmail}</p>
             <p><strong>Shipping Destination:</strong> {shippingAddress}</p>
           </div>
        </div>
      </div>
    </BlurBackground>
  );
}
