"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPreBooking } from "@/app/actions/orders";
import { Sparkles, CalendarDays, ShieldCheck, CreditCard, ShoppingBag } from "lucide-react";

interface Batch {
  id: string;
  price: number;
  harvestDate: Date;
  remainingQuantity: number;
  product: {
    name: string;
    category: string;
    farmer: {
      name: string;
      location: string;
    };
  };
}

interface PreBookFormProps {
  batch: Batch;
  initialQuantity: number;
}

export default function PreBookForm({ batch, initialQuantity }: PreBookFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "ONLINE" as "COD" | "ONLINE",
    region: "US",
  });

  // Calculate pricing
  const unitPrice = batch.price;
  const totalPrice = unitPrice * quantity;
  const advanceDue = totalPrice * 0.30;
  const balanceDue = totalPrice - advanceDue;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setError("Please complete all delivery details.");
      return;
    }

    setLoading(true);

    const result = await createPreBooking({
      batchId: batch.id,
      quantity,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      shippingAddress: formData.address,
      paymentMethod: formData.paymentMethod,
      region: formData.region,
    });

    setLoading(false);

    if (result.success && result.preBookingId) {
      // Redirect to tracking page under PRE-BOOK type
      router.push(`/order/prebook-${result.preBookingId}`);
    } else {
      setError(result.error || "Failed to finalize pre-booking reservation.");
    }
  };

  const harvestFormatted = new Date(batch.harvestDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Form details */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
        
        {/* Contact and Shipping */}
        <div className="glass-panel p-8 rounded-3xl bg-farm-cream-50">
          <h2 className="font-serif text-xl font-bold text-farm-green-900 border-b border-farm-green-800/10 pb-3 mb-6">
            1. Guest Reservation & Delivery
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="name" className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Your Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:ring-0 focus:outline-none text-farm-green-950"
                placeholder="Liam Baker"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="email" className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:ring-0 focus:outline-none text-farm-green-950"
                placeholder="liam@artisan.com"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1 mb-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="phone" className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Mobile Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:ring-0 focus:outline-none text-farm-green-950"
                placeholder="+1 (541) 555-0123"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="address" className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
              Shipping Address *
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              required
              value={formData.address}
              onChange={handleInputChange}
              className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:ring-0 focus:outline-none text-farm-green-950"
              placeholder="123 Sourdough Lane, Portland, OR 97201"
            />
          </div>

          <div className="flex flex-col space-y-1 mt-4">
            <label htmlFor="region" className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
              Delivery Region
            </label>
            <select
              id="region"
              value={formData.region}
              onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
              className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:ring-0 focus:outline-none text-farm-green-950"
            >
              <option value="US">United States · USD</option>
              <option value="IN">India · INR</option>
              <option value="EU">Europe · EUR</option>
            </select>
          </div>
        </div>

        {/* Payment */}
        <div className="glass-panel p-8 rounded-3xl bg-farm-cream-50">
          <div className="flex justify-between items-center border-b border-farm-green-800/10 pb-3 mb-6">
            <h2 className="font-serif text-xl font-bold text-farm-green-900">
              2. Advance Payment Options
            </h2>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-farm-gold-600/15 text-farm-gold-600 rounded-full px-2.5 py-0.5 font-bold">
              30% Advance Deposit Due Now
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="flex space-x-4 mb-6">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "ONLINE" }))}
              className={`flex-1 p-4 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                formData.paymentMethod === "ONLINE"
                  ? "border-farm-green-900 bg-farm-green-900/5 text-farm-green-950 font-bold"
                  : "border-farm-green-900/10 bg-transparent text-farm-green-800"
              }`}
            >
              <CreditCard className="h-4.5 w-4.5" />
              <span className="text-xs">Secure Card Simulator</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "COD" }))}
              className={`flex-1 p-4 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                formData.paymentMethod === "COD"
                  ? "border-farm-green-900 bg-farm-green-900/5 text-farm-green-950 font-bold"
                  : "border-farm-green-900/10 bg-transparent text-farm-green-800"
              }`}
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span className="text-xs">Advance on Delivery (COD)</span>
            </button>
          </div>

          {formData.paymentMethod === "ONLINE" ? (
            <div className="p-4 rounded-xl bg-farm-cream-200/50 border border-farm-green-900/5 text-xs text-farm-green-800 leading-relaxed font-sans font-light">
              The app creates a hosted payment intent for the advance deposit. Configure Stripe or Razorpay credentials to complete online collection outside this app.
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-farm-cream-200/50 border border-farm-green-900/5 text-xs text-farm-green-800 leading-relaxed font-sans font-light">
              Advance payment of 30% (${advanceDue.toFixed(2)}) will be collected via phone verification / check dispatch. Balance is due at harvest delivery.
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center space-x-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-full bg-farm-green-900 hover:bg-farm-gold-600 text-farm-cream-100 font-semibold tracking-wider px-6 py-4 text-sm transition-all duration-300 shadow-md disabled:opacity-50"
        >
          {loading ? "Authorizing Advance Deposit..." : `Lock In Harvest Reservation - Pay $${advanceDue.toFixed(2)}`}
        </button>
      </form>

      {/* Right Column: Reservation details */}
      <div className="lg:col-span-5">
        <div className="glass-panel p-6 rounded-3xl bg-farm-cream-50 sticky top-28 border border-farm-green-900/5">
          <h3 className="font-serif text-lg font-bold text-farm-green-950 border-b border-farm-green-800/10 pb-3 mb-4">
            Reservation Invoice
          </h3>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-farm-green-700">Crop Interest</span>
              <span className="font-semibold text-farm-green-950 text-right">{batch.product.name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-farm-green-700">Farmer Plot</span>
              <span className="font-semibold text-farm-green-950 text-right">{batch.product.farmer.name} ({batch.product.farmer.location})</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-farm-green-700">Estimated Harvest</span>
              <span className="font-semibold text-farm-green-950">{harvestFormatted}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-farm-green-700">Reserved Allocation</span>
              <span className="font-semibold text-farm-green-950">{quantity} kg</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-farm-green-700">UnitPrice</span>
              <span className="font-semibold text-farm-green-950">${unitPrice.toFixed(2)} / kg</span>
            </div>
          </div>

          <div className="border-t border-farm-green-800/10 pt-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-farm-green-700">Subtotal Price</span>
              <span className="text-farm-green-950 font-medium">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs p-2 rounded-xl bg-farm-cream-200 border border-farm-green-950/5">
              <span className="text-farm-gold-600 font-bold">Advance Paid Today (30%)</span>
              <span className="text-farm-green-950 font-bold font-mono">${advanceDue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-farm-green-700">Due Post-Harvest (70%)</span>
              <span className="text-farm-green-950 font-medium font-mono">${balanceDue.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-farm-green-800/10 bg-farm-cream-100 flex items-start space-x-2.5">
            <ShieldCheck className="h-4.5 w-4.5 text-farm-gold-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-farm-green-800 leading-relaxed font-sans font-light">
              <strong>Anticipation Guarantee:</strong> If the harvest fails or testing drops below A-Grade purity metrics, your deposit is 100% refunded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
