import { apiFetch } from "./api";

export interface PricingResolution {
  productId: string;
  basePrice: number;
  source: "product" | "price_list";
  discountScheme: {
    id: string;
    name: string;
    discountType: "PERCENTAGE" | "FLAT";
    value: number;
  } | null;
  discountAmount: number;
  finalUnitPrice: number;
}

export function resolvePricing(
  token: string,
  productId: string,
  customerId?: string,
  quantity?: number,
) {
  const params = new URLSearchParams({ productId });
  if (customerId) params.set("customerId", customerId);
  if (quantity) params.set("quantity", String(quantity));
  return apiFetch<PricingResolution>(`/pricing/resolve?${params.toString()}`, { token });
}
