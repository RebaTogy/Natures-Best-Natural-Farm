import LegalPage from "@/components/LegalPage";

export default function CancellationPolicyPage() {
  return (
    <LegalPage title="Cancellation Policy">
      <p>Retail orders can be cancelled before fulfillment enters shipped status. Shipped or delivered orders move to refund review instead.</p>
      <p>Pre-bookings can be cancelled before harvest processing begins. The system records cancellation time and creates a refund review record.</p>
      <p>Administrative overrides require an authenticated admin session and are retained through order, notification, and refund records.</p>
    </LegalPage>
  );
}
