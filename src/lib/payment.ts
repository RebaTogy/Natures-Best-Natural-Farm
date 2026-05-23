interface PaymentRequest {
  amount: number;
  currency: string;
  referenceId: string;
  kind: "ORDER" | "PREBOOK_ADVANCE" | "PREBOOK_BALANCE";
}

export async function createOnlinePayment(request: PaymentRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const razorpayKey = process.env.RAZORPAY_KEY_ID;

  if (stripeKey) {
    return {
      provider: "STRIPE",
      status: "PENDING",
      transactionId: `STRIPE_PENDING_${request.referenceId}`,
      checkoutUrl: `/order/${request.referenceId}`,
    };
  }

  if (razorpayKey) {
    return {
      provider: "RAZORPAY",
      status: "PENDING",
      transactionId: `RAZORPAY_PENDING_${request.referenceId}`,
      checkoutUrl: `/order/${request.referenceId}`,
    };
  }

  return {
    provider: "MANUAL",
    status: "PENDING",
    transactionId: `PAYMENT_REQUIRED_${request.referenceId}`,
    checkoutUrl: null,
  };
}

export function statusForNewOrder(paymentMethod: "COD" | "ONLINE") {
  return paymentMethod === "COD" ? "PENDING" : "PAYMENT_REQUIRED";
}

export function paymentStatusForMethod(paymentMethod: "COD" | "ONLINE") {
  return paymentMethod === "COD" ? "PENDING" : "PENDING";
}
