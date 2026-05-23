"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/app/actions/account";

export default function WishlistButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await toggleWishlist(productId);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center rounded-full bg-farm-cream-50/90 px-4 py-2 text-xs font-semibold text-farm-green-950 hover:bg-farm-gold-600 hover:text-farm-cream-50 disabled:opacity-50"
    >
      <Heart className="mr-1.5 h-4 w-4" />
      Wishlist
    </button>
  );
}
