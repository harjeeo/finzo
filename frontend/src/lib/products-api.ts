import { apiFetch } from "./api";

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  unit: string;
  hsnCode: string | null;
  purchasePrice: string;
  sellingPrice: string;
  gstRate: string;
  openingStock: string;
  currentStock: string;
  minStockLevel: string;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  unit?: string;
  hsnCode?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  gstRate?: number;
  openingStock?: number;
  minStockLevel?: number;
}

export function listProducts(token: string) {
  return apiFetch<Product[]>("/products", { token });
}

export function createProduct(token: string, input: ProductInput) {
  return apiFetch<Product>("/products", { method: "POST", body: input, token });
}

export function updateProduct(token: string, id: string, input: ProductInput) {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deleteProduct(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/products/${id}`, {
    method: "DELETE",
    token,
  });
}
