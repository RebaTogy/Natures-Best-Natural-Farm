"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCartQuantity, removeFromCart, toggleSaveForLater } from "@/app/actions/cart";
import { placeOrder } from "@/app/actions/orders";
import { logEvent } from "@/app/actions/analytics";
import { Trash2, ShieldCheck, CreditCard, ShoppingBag, Plus, Minus } from "lucide-react";
import Link from "next/link";

interface CartItem {
  id: string;
  quantity: number;
  savedForLater: boolean;
  batch: {
    id: string;
    price: number;
    remainingQuantity: number;
    product: {
      name: string;
      category: string;
      farmer: {
        name: string;
      };
    };
  };
}

interface CheckoutFormProps {
  initialItems: CartItem[];
}

export default function CheckoutForm({ initialItems }: CheckoutFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form details
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "ONLINE" as "COD" | "ONLINE",
    region: "US",
  });

  // Calculate totals
  const activeItems = items.filter((item) => !item.savedForLater);
  const savedItems = items.filter((item) => item.savedForLater);
  const subtotal = activeItems.reduce((sum, item) => sum + item.quantity * item.batch.price, 0);
  const shipping = subtotal > 50 ? 0 : 5.00;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Modify cart quantities live
  const handleQtyChange = async (itemId: string, currentQty: number, change: number) => {
    const targetQty = currentQty + change;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (targetQty <= 0) {
      await handleRemoveItem(itemId);
      return;
    }

    if (targetQty > item.batch.remainingQuantity) {
      alert(`Only ${item.batch.remainingQuantity} kg available for this batch plot.`);
      return;
    }

    const res = await updateCartQuantity(itemId, targetQty);
    if (res.success) {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: targetQty } : i))
      );
      router.refresh();
    } else {
      alert(res.error || "Failed to update quantity.");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const res = await removeFromCart(itemId);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      router.refresh();
    } else {
      alert("Failed to remove item.");
    }
  };

  const handleSaveToggle = async (itemId: string, savedForLater: boolean) => {
    const res = await toggleSaveForLater(itemId, savedForLater);
    if (res.success) {
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, savedForLater } : savedForLater ? i : { ...i, savedForLater: true })));
      router.refresh();
    } else {
      alert(res.error || "Failed to update cart item.");
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeItems.length === 0) {
      setError("Your active cart is empty.");
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setError("Please complete all shipping and contact details.");
      return;
    }

    setLoading(true);

    // Track analytics checkout stage
    await logEvent("CHECKOUT", { pageUrl: "/checkout" });

    const result = await placeOrder({
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      shippingAddress: formData.address,
      paymentMethod: formData.paymentMethod,
      region: formData.region,
    });

    setLoading(false);

    if (result.success && result.orderId) {
      router.push(`/order/retail-${result.orderId}`);
    } else {
      setError(result.error || "Failed to process transaction. Verify stock levels.");
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-farm-cream-50 rounded-3xl border border-dashed border-farm-green-800/15 max-w-xl mx-auto mt-10">
        <span className="text-4xl">🧺</span>
        <h3 className="font-serif text-xl font-bold text-farm-green-900 mt-4">Your Cart is Empty</h3>
        <p className="text-sm text-farm-green-700 mt-2 font-light">
          Browse the active seasonal crop registry to add farm harvests to your pantry.
        </p>
        <Link
          href="/marketplace"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-farm-green-900 px-6 py-3 text-xs font-semibold tracking-wider text-farm-cream-100 hover:bg-farm-gold-600 transition-colors"
        >
          Go to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
      {/* Left Column: Cart items and Guest Info */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Shopping Cart List */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-farm-cream-50">
          <h2 className="font-serif text-xl font-bold text-farm-green-900 border-b border-farm-green-800/10 pb-3 mb-6">
            1. Crop Cart Overview
          </h2>

          <div className="divide-y divide-farm-green-800/5">
            {activeItems.map((item) => (
              <div key={item.id} className="py-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">
                    BATCH #{item.batch.id.substring(0, 8).toUpperCase()}
                  </span>
                  <h4 className="text-sm font-bold text-farm-green-950 truncate mt-0.5">
                    {item.batch.product.name}
                  </h4>
                  <p className="text-2xs text-farm-green-700 font-sans mt-0.5">
                    Grown by {item.batch.product.farmer.name}
                  </p>
                  <p className="text-xs text-farm-green-900 mt-2 font-serif font-bold">
                    ${item.batch.price.toFixed(2)} / kg
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-3 shrink-0">
                  {/* Quantity controls */}
                  <div className="flex items-center rounded-full border border-farm-green-900/10 bg-farm-cream-100 px-2 py-0.5">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, item.quantity, -1)}
                      className="px-1.5 py-1 text-farm-green-800 hover:text-farm-gold-600"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold text-farm-green-950">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, item.quantity, 1)}
                      className="px-1.5 py-1 text-farm-green-800 hover:text-farm-gold-600"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-farm-green-950">
                      ${(item.quantity * item.batch.price).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded bg-transparent hover:bg-red-50 text-farm-green-700 hover:text-red-600 transition-colors"
                      title="Remove from Cart"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveToggle(item.id, true)}
                      className="text-2xs font-semibold text-farm-green-700 hover:text-farm-gold-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {savedItems.length > 0 && (
            <div className="mt-6 border-t border-farm-green-800/10 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-farm-green-700">Saved for Later</h3>
              {savedItems.map((item) => (
                <div key={item.id} className="mt-3 flex items-center justify-between text-xs">
                  <span>{item.batch.product.name} · {item.quantity} kg</span>
                  <button type="button" onClick={() => handleSaveToggle(item.id, false)} className="font-semibold text-farm-green-900 hover:text-farm-gold-600">
                    Move to cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guest Delivery Shipping form */}
        <form onSubmit={handleCheckoutSubmit} className="space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-farm-cream-50">
            <h2 className="font-serif text-xl font-bold text-farm-green-900 border-b border-farm-green-800/10 pb-3 mb-6">
              2. Guest Contact & Delivery
            </h2>
            <p className="mb-4 text-xs text-farm-green-700">
              Checking out as a guest. <Link href="/login" className="font-semibold text-farm-green-950 hover:text-farm-gold-600">Login optionally</Link> to save order history and traceability access.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col space-y-1">
                <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                  Customer Name *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
                  placeholder="Elena Woods"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
                  placeholder="elena@woods.com"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1 mb-4">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Mobile Phone Number *
              </label>
              <input
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
                placeholder="+1 (503) 555-9876"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Shipping Address *
              </label>
              <textarea
                name="address"
                rows={3}
                required
                value={formData.address}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
                placeholder="456 Artisan Way, Seattle, WA 98101"
              />
            </div>

            <div className="flex flex-col space-y-1 mt-4">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Delivery Region
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
              >
                <option value="US">United States · USD</option>
                <option value="IN">India · INR</option>
                <option value="EU">Europe · EUR</option>
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-farm-cream-50">
            <h2 className="font-serif text-xl font-bold text-farm-green-900 border-b border-farm-green-800/10 pb-3 mb-6">
              3. Secure Payment Options
            </h2>

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
                <span className="text-xs">Cash on Delivery (COD)</span>
              </button>
            </div>

            {formData.paymentMethod === "ONLINE" ? (
              <div className="p-4 rounded-xl bg-farm-cream-200/50 border border-farm-green-900/5 text-xs text-farm-green-800 leading-relaxed font-sans font-light">
                Online payment is created as a gateway payment intent. Configure Stripe or Razorpay environment keys to redirect to hosted checkout; card details are never collected by this app.
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-farm-cream-200/50 border border-farm-green-900/5 text-xs text-farm-green-800 leading-relaxed font-sans font-light">
                Pay in cash/check directly at your doorstep when the logistics partner delivers your fresh harvest allocation.
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-full bg-farm-green-900 hover:bg-farm-gold-600 text-farm-cream-100 font-semibold tracking-wider px-6 py-4 text-sm transition-all duration-300 shadow-md disabled:opacity-50"
          >
            {loading ? "Completing Purchase..." : `Verify & Place Order - $${total.toFixed(2)}`}
          </button>
        </form>
      </div>

      {/* Right Column: Order Ledger */}
      <div className="lg:col-span-5">
        <div className="glass-panel p-6 rounded-3xl bg-farm-cream-50 sticky top-28 border border-farm-green-900/5">
          <h3 className="font-serif text-lg font-bold text-farm-green-950 border-b border-farm-green-800/10 pb-3 mb-4">
            Payment Summary
          </h3>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-farm-green-700">Subtotal Price</span>
              <span className="font-semibold text-farm-green-950 font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-farm-green-700">Cold-Chain Shipping</span>
              <span className="font-semibold text-farm-green-950 font-mono">
                {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-[9px] text-farm-green-600 italic">
                Add ${(50 - subtotal).toFixed(2)} more to unlock free temperature-controlled shipping!
              </p>
            )}
          </div>

          <div className="border-t border-farm-green-800/10 pt-4 flex justify-between items-center text-sm mb-6">
            <span className="text-farm-green-900 font-bold">Total Amount Due</span>
            <span className="text-lg font-bold text-farm-green-950 font-mono">${total.toFixed(2)}</span>
          </div>

          <div className="p-4 rounded-xl border border-farm-green-800/10 bg-farm-cream-100 flex items-start space-x-2.5">
            <ShieldCheck className="h-4.5 w-4.5 text-farm-gold-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-farm-green-800 leading-relaxed font-sans font-light">
              <strong>Guest Checkout:</strong> We store no account passwords. You track progress using the order receipt token on the next page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
