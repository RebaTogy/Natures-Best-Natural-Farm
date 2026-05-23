"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { payPreBookingBalance } from "@/app/actions/orders";
import { CreditCard, Sparkles } from "lucide-react";

interface PayBalanceButtonProps {
  preBookingId: string;
  balanceAmount: number;
}

export default function PayBalanceButton({ preBookingId, balanceAmount }: PayBalanceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePayBalance = async () => {
    setLoading(true);
    setMessage(null);

    const res = await payPreBookingBalance(preBookingId);
    setLoading(false);

    if (res.success) {
      setMessage("Success! Final balance payment recorded. Thank you for supporting our farm.");
      router.refresh();
    } else {
      setMessage(res.error || "Failed to process payment.");
    }
  };

  return (
    <div className="mt-4 p-5 rounded-2xl border border-farm-gold-500/30 bg-farm-gold-600/5 flex flex-col space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="text-farm-green-800">Remaining 70% Balance:</span>
        <span className="text-base font-bold text-farm-green-950">${balanceAmount.toFixed(2)}</span>
      </div>
      <button
        onClick={handlePayBalance}
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-full bg-farm-gold-600 hover:bg-farm-gold-500 text-farm-cream-50 font-semibold tracking-wider px-5 py-3 text-xs transition-all duration-300 shadow"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {loading ? "Processing Final Transaction..." : "Pay Remaining Balance"}
      </button>
      {message && (
        <p className="text-2xs font-semibold text-center text-farm-green-900 mt-1">
          {message}
        </p>
      )}
    </div>
  );
}
