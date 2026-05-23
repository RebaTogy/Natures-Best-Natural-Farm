export type RegionCode = "US" | "IN" | "EU";

export function normalizeRegion(region?: string | null): RegionCode {
  const value = (region || "US").toUpperCase();
  if (value === "IN" || value === "EU") return value;
  return "US";
}

export function currencyForRegion(region?: string | null) {
  const normalized = normalizeRegion(region);
  if (normalized === "IN") return "INR";
  if (normalized === "EU") return "EUR";
  return "USD";
}

export function convertAmount(amount: number, currency: string) {
  if (currency === "INR") return amount * 83;
  if (currency === "EUR") return amount * 0.92;
  return amount;
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "INR" ? 0 : 2,
  }).format(amount);
}

export function calculateShipping(subtotal: number, region?: string | null) {
  const normalized = normalizeRegion(region);
  if (subtotal <= 0) return 0;
  if (normalized === "IN") return subtotal > 4000 ? 0 : 250;
  if (normalized === "EU") return subtotal > 80 ? 0 : 12;
  return subtotal > 50 ? 0 : 5;
}

export function getDeliveryEstimate(region?: string | null) {
  const normalized = normalizeRegion(region);
  if (normalized === "IN") return "5-8 days";
  if (normalized === "EU") return "4-7 days";
  return "3-5 days";
}
