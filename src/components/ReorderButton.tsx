"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reorder } from "@/app/actions/account";

export default function ReorderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReorder = async () => {
    setLoading(true);
    const res = await reorder(orderId);
    setLoading(false);
    if (res.success) router.push("/checkout");
    else alert(res.error || "Unable to reorder.");
  };

  return (
    <button
      onClick={handleReorder}
      disabled={loading}
      className="rounded-full bg-farm-green-900 px-4 py-2 text-2xs font-semibold tracking-wider text-farm-cream-100 hover:bg-farm-gold-600 disabled:opacity-50"
    >
      {loading ? "Adding..." : "Reorder"}
    </button>
  );
}
