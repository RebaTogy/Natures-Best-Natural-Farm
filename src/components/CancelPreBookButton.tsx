"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelPreBooking } from "@/app/actions/orders";

export default function CancelPreBookButton({ preBookingId }: { preBookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Cancel this reservation and start refund review?")) return;
    setLoading(true);
    const res = await cancelPreBooking(preBookingId);
    setLoading(false);
    if (res.success) router.refresh();
    else alert(res.error || "Unable to cancel reservation.");
  };

  return (
    <button onClick={handleCancel} disabled={loading} className="mt-3 w-full rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
      {loading ? "Cancelling..." : "Cancel Reservation"}
    </button>
  );
}
