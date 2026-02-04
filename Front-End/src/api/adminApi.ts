import { authHeaders } from "./authApi";
import { API_BASE_URL } from "../config/api";

function headers(): Record<string, string> {
  return { "Content-Type": "application/json", ...authHeaders() };
}

export interface CompanyDto {
  id: number;
  name: string;
  code: string;
}

export interface AdminProductCreateRequest {
  companyId: number;
  categoryId: number;
  name: string;
  description?: string;
  size?: string;  // 목재 합판 규격 (예: 1220 × 2440mm)
  basePrice?: number;
  specName?: string;
  typeName?: string;
  variantPrice?: number;
}

export interface AdminProductUpdateRequest {
  name?: string;
  description?: string;
  size?: string;  // 목재 합판 규격
  basePrice?: number;
}

export interface AdminVariantUpdateRequest {
  specName?: string;
  typeName?: string;
  price?: number;
}

export interface AdminProductSearchItem {
  id: number;
  name: string;
  description: string | null;
  size: string | null;  // 목재 합판 규격
  basePrice: number | null;
  companyId: number;
  companyName: string;
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  variants: { id: number; specName: string; typeName: string; price: number }[];
}

export async function fetchAdminCompanies(): Promise<CompanyDto[]> {
  const res = await fetch(`${API_BASE_URL}/admin/companies`, { method: "GET", headers: headers() });
  if (!res.ok) throw new Error(res.status === 403 ? "권한이 없습니다." : `회사 목록 조회 실패 (${res.status})`);
  return res.json();
}

export async function createAdminCompany(body: { name: string; code?: string }): Promise<CompanyDto> {
  const res = await fetch(`${API_BASE_URL}/admin/companies`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.status === 403 ? "권한이 없습니다." : text || "회사 생성 실패");
  }
  return res.json();
}

export async function createAdminCategory(body: {
  companyId: number;
  name: string;
  code?: string;
  parentId?: number | null;
}): Promise<{ id: number; name: string; code: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/categories`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.status === 403 ? "권한이 없습니다." : text || "카테고리 생성 실패");
  }
  return res.json();
}

export async function createAdminProduct(body: AdminProductCreateRequest): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/admin/products`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.status === 403 ? "권한이 없습니다." : text || `제품 추가 실패 (${res.status})`);
  }
  return res.json();
}

export async function searchAdminProducts(params: {
  keyword?: string;
  companyId?: number;
  categoryId?: number;
}): Promise<AdminProductSearchItem[]> {
  const sp = new URLSearchParams();
  if (params.keyword != null && params.keyword !== "") sp.set("keyword", params.keyword);
  if (params.companyId != null) sp.set("companyId", String(params.companyId));
  if (params.categoryId != null) sp.set("categoryId", String(params.categoryId));
  const q = sp.toString();
  const url = `${API_BASE_URL}/admin/products/search${q ? `?${q}` : ""}`;
  const res = await fetch(url, { method: "GET", headers: headers() });
  if (!res.ok) throw new Error(res.status === 403 ? "권한이 없습니다." : `검색 실패 (${res.status})`);
  return res.json();
}

export async function updateAdminProduct(id: number, body: AdminProductUpdateRequest): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.status === 403 ? "권한이 없습니다." : text || `수정 실패 (${res.status})`);
  }
}

export async function updateAdminVariant(id: number, body: AdminVariantUpdateRequest): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/products/variants/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.status === 403 ? "권한이 없습니다." : text || `규격 수정 실패 (${res.status})`);
  }
}

export async function deleteAdminProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, { method: "DELETE", headers: headers() });
  if (!res.ok) throw new Error(res.status === 403 ? "권한이 없습니다." : `삭제 실패 (${res.status})`);
}

export async function deleteAdminVariant(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/products/variants/${id}`, { method: "DELETE", headers: headers() });
  if (!res.ok) throw new Error(res.status === 403 ? "권한이 없습니다." : `규격 삭제 실패 (${res.status})`);
}
