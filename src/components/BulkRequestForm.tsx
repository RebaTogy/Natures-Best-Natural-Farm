"use client";

import { useState } from "react";
import { submitBulkRequestForm } from "@/app/actions/bulk";
import { Landmark, ShieldCheck, Mail, Phone, Calendar, ArrowRight } from "lucide-react";

export default function BulkRequestForm() {
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    productInterest: "Spelt Grain",
    quantity: 500,
    contactPreference: "EMAIL",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = new FormData(e.currentTarget);
    const res = await submitBulkRequestForm(payload);

    setLoading(false);

    if (res.success && res.requestId) {
      setSuccessId(res.requestId);
      setFormData({
        name: "",
        email: "",
        phone: "",
        businessName: "",
        productInterest: "Spelt Grain",
        quantity: 500,
        contactPreference: "EMAIL",
        message: "",
      });
    } else {
      setError(res.error || "Failed to submit wholesale inquiry.");
    }
  };

  return (
    <div className="glass-panel p-8 sm:p-10 rounded-3xl bg-farm-cream-50/95 shadow-md border border-farm-gold-500/10">
      {successId ? (
        <div className="text-center py-10 space-y-5 animate-fade-in">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-800/10 text-green-850 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h3 className="font-serif text-2xl font-bold text-farm-green-950">Wholesale Request Logged</h3>
          <p className="text-sm text-farm-green-800 max-w-md mx-auto leading-relaxed">
            Your volume requisition has been logged directly on the farm dashboard. An agricultural account director will dispatch the cold-chain logistics itinerary and wholesale pricing sheets to your inbox.
          </p>
          <div className="p-3 bg-farm-cream-200 rounded-xl font-mono text-xs text-farm-green-900 inline-block">
            B2B RECORD ID: #{successId.toUpperCase()}
          </div>
          <div>
            <button
              onClick={() => setSuccessId(null)}
              className="rounded-full bg-farm-green-900 hover:bg-farm-gold-600 text-farm-cream-100 px-6 py-3 text-xs font-semibold tracking-wider transition-colors duration-300"
            >
              Submit Another Inquiry
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="font-serif text-xl font-bold text-farm-green-900 border-b border-farm-green-800/10 pb-3 mb-6">
            Institutional Quote Requisition
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Contact Full Name *
              </label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
                placeholder="Marcus Vance"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Business Entity Name
              </label>
              <input
                name="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
                placeholder="Organic Sourdough Bakery Inc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Wholesale Email *
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
                placeholder="buyer@sourdough.com"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Direct Telephone *
              </label>
              <input
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
                placeholder="+1 (206) 555-0199"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Harvest Commodity Group *
              </label>
              <select
                name="productInterest"
                value={formData.productInterest}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
              >
                <option value="Spelt Grain">Heritage Spelt Wheat Grain</option>
                <option value="Lavender Honey">Wild Lavender Honey</option>
                <option value="Rainbow Carrots">Organic Rainbow Vegetables</option>
                <option value="Various Mix">Mixed General Requisition</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Target Volume Allocation (kg) *
              </label>
              <input
                name="quantity"
                type="number"
                min="100"
                required
                value={formData.quantity}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Contact Preference
              </label>
              <select
                name="contactPreference"
                value={formData.contactPreference}
                onChange={handleInputChange}
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
              >
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
                Specs File (PDF/DOC)
              </label>
              <input
                name="specFile"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-2 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">
              Quality Specs & Packaging Instructions
            </label>
            <textarea
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleInputChange}
              className="rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:border-farm-gold-500 focus:outline-none text-farm-green-950"
              placeholder="E.g., Require heat-sealed multi-wall paper bags, third-party gluten contamination testing index, or specific pallet shipping protocols."
            />
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
            {loading ? "Filing Requisition Record..." : "Submit Quote Request"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
