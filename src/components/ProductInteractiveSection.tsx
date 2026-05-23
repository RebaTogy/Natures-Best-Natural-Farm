"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/actions/cart";
import { logEvent } from "@/app/actions/analytics";
import { CalendarDays, ShoppingBag, HelpCircle, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

interface Batch {
  id: string;
  harvestDate: Date;
  totalQuantity: number;
  remainingQuantity: number;
  price: number;
  status: string;
  isFuture: boolean;
}

interface ProductInteractiveSectionProps {
  productId: string;
  productName: string;
  batches: Batch[];
}

export default function ProductInteractiveSection({
  productId,
  productName,
  batches,
}: ProductInteractiveSectionProps) {
  const router = useRouter();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const handleSelectBatch = async (batchId: string) => {
    setSelectedBatchId(batchId);
    setMessage(null);
    setQuantity(1);

    // Track analytics event: Batch Selection
    await logEvent("STORY_ENGAGE", { productId, batchId });
  };

  const handleAddToCart = async () => {
    if (!selectedBatchId) return;
    setLoading(true);
    setMessage(null);

    const res = await addToCart(selectedBatchId, quantity);
    setLoading(false);

    if (res.success) {
      setMessage({ type: "success", text: `Successfully added ${quantity} kg of ${productName} (Batch ${selectedBatchId.substring(0, 8)}) to your cart.` });
      // Log event
      await logEvent("CART_ADD", { productId, batchId: selectedBatchId });
      // Refresh router to update navbar cart count
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.error || "Failed to add to cart." });
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* Batch Registry Picker */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-farm-green-600 font-semibold mb-4 flex items-center">
          <CalendarDays className="h-4 w-4 mr-1 text-farm-gold-600" />
          Select Specific Harvest Batch
        </h3>

        {batches.length === 0 ? (
          <p className="text-sm text-farm-green-800 italic">No batches currently logged for this product.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {batches.map((batch) => {
              const isSelected = batch.id === selectedBatchId;
              const isFuture = batch.isFuture;
              const formattedDate = new Date(batch.harvestDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              return (
                <button
                  key={batch.id}
                  onClick={() => handleSelectBatch(batch.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? "bg-farm-green-900 border-farm-green-900 text-farm-cream-50 shadow-md scale-[1.01]"
                      : "bg-farm-cream-50 border-farm-green-900/10 text-farm-green-950 hover:border-farm-green-900/30"
                  }`}
                >
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xs font-mono tracking-wider opacity-75">
                        BATCH #{batch.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                          isFuture
                            ? isSelected
                              ? "bg-farm-gold-500 text-farm-green-950"
                              : "bg-farm-gold-600/15 text-farm-gold-600"
                            : isSelected
                            ? "bg-farm-cream-100 text-farm-green-950"
                            : "bg-farm-green-800/10 text-farm-green-800"
                        }`}
                      >
                        {isFuture ? "Pre-Booking (Upcoming)" : "In-Stock (Active)"}
                      </span>
                    </div>

                    <span className="text-sm font-semibold">
                      {isFuture ? "Estimated Harvest:" : "Harvest Completed:"} {formattedDate}
                    </span>

                    <span className="text-2xs opacity-80">
                      Plot Soil Index: Organic Loam • Yield capacity: {batch.totalQuantity} kg
                    </span>
                  </div>

                  <div className="flex flex-col sm:items-end space-y-1 mt-2 sm:mt-0">
                    <span className="text-2xs opacity-75">Stock Allocation</span>
                    <span
                      className={`text-sm font-bold ${
                        batch.remainingQuantity <= batch.totalQuantity * 0.20
                          ? "text-red-500 font-semibold"
                          : ""
                      }`}
                    >
                      {batch.remainingQuantity <= 0
                        ? "FULLY BOOKED"
                        : `${batch.remainingQuantity} kg available`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* DYNAMIC PRICING & CHECKOUT BLOCK (HIDDEN UNTIL BATCH SELECTION) */}
      <div
        className={`transition-all duration-500 transform ${
          selectedBatch
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-4 scale-95 pointer-events-none h-0 overflow-hidden"
        }`}
      >
        {selectedBatch && (
          <div className="glass-panel p-6 rounded-3xl border border-farm-gold-500/20 bg-farm-cream-50/90 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-farm-green-800/10 pb-5 mb-5 gap-4">
              <div>
                <p className="text-[10px] text-farm-green-600 uppercase tracking-widest font-semibold">
                  Unit Pricing
                </p>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-3xl font-bold font-serif text-farm-green-900">
                    ${selectedBatch.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-farm-green-700 font-medium">/ per kg</span>
                </div>
                {selectedBatch.isFuture && (
                  <p className="text-[10px] text-farm-gold-600 mt-1 font-semibold flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Pre-booking savings applied (-20% wholesale rate)
                  </p>
                )}
              </div>

              {/* Order total indicator */}
              <div className="sm:text-right">
                <p className="text-[10px] text-farm-green-600 uppercase tracking-widest font-semibold font-sans">
                  Estimated Total
                </p>
                <span className="text-xl font-bold text-farm-green-950 block mt-1">
                  ${(selectedBatch.price * quantity).toFixed(2)}
                </span>
                {selectedBatch.isFuture && (
                  <span className="text-2xs text-farm-gold-600 block italic font-semibold">
                    30% Advance Due: ${(selectedBatch.price * quantity * 0.30).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Availability / Form actions */}
            {selectedBatch.remainingQuantity <= 0 ? (
              <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-4 rounded-2xl border border-red-100">
                <AlertCircle className="h-5 w-5" />
                <span className="text-xs font-semibold">This harvest plot batch has sold out completely.</span>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {/* Quantity Input */}
                <div className="flex items-center space-x-4">
                  <label htmlFor="qty" className="text-xs font-semibold text-farm-green-800 font-sans">
                    Quantity (kg):
                  </label>
                  <div className="flex items-center rounded-full border border-farm-green-900/10 bg-farm-cream-100 px-2.5">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2 py-2 text-farm-green-800 font-bold hover:text-farm-gold-600"
                    >
                      -
                    </button>
                    <input
                      id="qty"
                      type="number"
                      min="1"
                      max={selectedBatch.remainingQuantity}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(
                            1,
                            Math.min(
                              selectedBatch.remainingQuantity,
                              parseInt(e.target.value) || 1
                            )
                          )
                        )
                      }
                      className="w-12 border-0 bg-transparent text-center text-sm font-semibold text-farm-green-950 focus:ring-0 focus:outline-none"
                    />
                    <button
                      onClick={() =>
                        setQuantity(Math.min(selectedBatch.remainingQuantity, quantity + 1))
                      }
                      className="px-2 py-2 text-farm-green-800 font-bold hover:text-farm-gold-600"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-2xs text-farm-green-600 font-sans">
                    Max: {selectedBatch.remainingQuantity} kg
                  </span>
                </div>

                {/* Checkout CTAs */}
                {selectedBatch.isFuture ? (
                  <Link
                    href={`/prebook/${selectedBatch.id}?qty=${quantity}`}
                    className="w-full inline-flex items-center justify-center rounded-full bg-farm-gold-600 hover:bg-farm-gold-500 text-farm-cream-50 font-semibold tracking-wider px-6 py-4 text-sm transition-all duration-300 shadow-md hover:scale-[1.01]"
                  >
                    Secure Pre-Booking (Pay 30% Advance)
                  </Link>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-full bg-farm-green-900 hover:bg-farm-gold-600 text-farm-cream-100 font-semibold tracking-wider px-6 py-4 text-sm transition-all duration-300 shadow-md hover:scale-[1.01] disabled:opacity-50"
                  >
                    {loading ? "Allocating Stock..." : "Add to Kitchen Cart"}
                    <ShoppingBag className="ml-2 h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            )}

            {/* Error / Success Banners */}
            {message && (
              <div
                className={`mt-4 p-4 rounded-2xl text-xs font-medium border flex items-center space-x-2 animate-fade-in ${
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{message.text}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
