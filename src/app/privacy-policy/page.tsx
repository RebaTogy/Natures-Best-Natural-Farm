import LegalPage from "@/components/LegalPage";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>We collect customer contact, delivery, order, and payment-status data only to fulfill harvest allocations, reservations, support, fraud prevention, and legal record keeping.</p>
      <p>Payment card data is not stored by this application. Online payments must be completed through a configured payment gateway.</p>
      <p>Customers may request correction or deletion of account data where retention is not required for tax, fulfillment, dispute, or traceability obligations.</p>
    </LegalPage>
  );
}
