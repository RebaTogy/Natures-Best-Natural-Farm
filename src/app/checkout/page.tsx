import { getCart } from "@/app/actions/cart";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import CheckoutForm from "@/components/CheckoutForm";
import BlurBackground from "@/components/ui/BlurBackground";
import { ShoppingBag } from "lucide-react";

export const revalidate = 0; // Fresh cart contents check

export default async function CheckoutPage() {
  const cartItems = await getCart();

  // Map to the format CheckoutForm expects
  const items = cartItems.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    savedForLater: item.savedForLater,
    batch: {
      id: item.batchId,
      price: item.batch.price,
      remainingQuantity: item.batch.remainingQuantity,
      product: {
        name: item.batch.product.name,
        category: item.batch.product.category,
        farmer: {
          name: item.batch.product.farmer.name,
        },
      },
    },
  }));

  return (
    <BlurBackground className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <AnalyticsTracker eventType="PAGE_VIEW" pageUrl="/checkout" />
      {/* Title */}
      <div className="border-b border-farm-green-800/10 pb-8">
        <span className="text-2xs uppercase tracking-widest font-semibold text-farm-gold-600 flex items-center mb-1">
          <ShoppingBag className="h-4 w-4 mr-1" />
          Pantry Stock Allocation
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-farm-green-900 tracking-tight">
          Pantry Checkout
        </h1>
        <p className="mt-2 text-sm text-farm-green-700 font-sans font-light">
          Complete guest checkout details to allocate your harvest portions. Single-origin tracking details unlock immediately after order validation.
        </p>
      </div>

      <CheckoutForm initialItems={items} />
    </BlurBackground>
  );
}
