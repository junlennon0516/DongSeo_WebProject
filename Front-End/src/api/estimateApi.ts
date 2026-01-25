import { authHeaders } from './authApi';

const API_BASE_URL = import.meta.env.DEV 
  ? "http://localhost:8080/api" 
  : "/api";

function headers(): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

export interface Category {
  id: number;
  name: string;
  code: string;
}

export interface Product {
  id: number;
  name: string;
  basePrice: number;
  description?: string;
  category: {
    id: number;
    name: string;
    code: string;
  };
}

export interface Option {
  id: number;
  name: string;
  addPrice: number;
  category?: {
    id: number;
    name: string;
    code: string;
  } | null;
}

export interface EstimateRequest {
  companyId: number;
  productId: number;
  specName?: string;
  typeName?: string;
  width?: number;
  height?: number;
  optionIds?: number[];
  quantity: number;
}

export interface EstimateResponse {
  productName: string;
  unitPrice: number;
  optionPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface ProductVariant {
  id: number;
  specName: string;
  typeName: string;
  price: number;
}

export interface Color {
  id: number;
  name: string;
  colorCode: string;
  cost?: number; // 추가 비용 비율 (예: 0.1 = 10%)
  company: {
    id: number;
    name: string;
    code: string;
  };
}

// 서버 연결 확인 (로그인 상태에서 호출)
export async function checkServerConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/estimates/ping`, { headers: headers() });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 메인 카테고리 목록 조회
export async function fetchCategories(companyId: number = 1): Promise<Category[]> {
  try {
    const url = `${API_BASE_URL}/categories?companyId=${companyId}`;
    console.log('메인 카테고리 조회 요청:', url);
    const response = await fetch(url, { method: 'GET', headers: headers() });
    console.log('메인 카테고리 조회 응답 상태:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('메인 카테고리 조회 실패:', errorText);
      throw new Error(`메인 카테고리 조회 실패 (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    console.log('메인 카테고리 조회 성공:', data);
    return data;
  } catch (error: any) {
    console.error('메인 카테고리 조회 에러:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (http://localhost:8080)');
    }
    throw error;
  }
}

// 세부 카테고리 목록 조회
export async function fetchSubCategories(parentId: number): Promise<Category[]> {
  try {
    const url = `${API_BASE_URL}/subcategories?parentId=${parentId}`;
    console.log('세부 카테고리 조회 요청:', url);
    const response = await fetch(url, { method: 'GET', headers: headers() });
    console.log('세부 카테고리 조회 응답 상태:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('세부 카테고리 조회 실패:', errorText);
      throw new Error(`세부 카테고리 조회 실패 (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    console.log('세부 카테고리 조회 성공:', data);
    return data;
  } catch (error: any) {
    console.error('세부 카테고리 조회 에러:', error);
    throw error;
  }
}

// 카테고리별 제품 목록 조회
export async function fetchProducts(categoryId: number): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/products?categoryId=${categoryId}`;
    console.log('제품 조회 요청:', url);
    const response = await fetch(url, { method: 'GET', headers: headers() });
    console.log('제품 조회 응답 상태:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('제품 조회 실패:', errorText);
      throw new Error(`제품 조회 실패 (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    console.log('제품 조회 성공:', data);
    return data;
  } catch (error: any) {
    console.error('제품 조회 에러:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (http://localhost:8080)');
    }
    throw error;
  }
}

// 제품별 옵션 목록 조회
export async function fetchOptions(productId: number | null, companyId: number = 1): Promise<Option[]> {
  try {
    const url = productId 
      ? `${API_BASE_URL}/options?productId=${productId}&companyId=${companyId}`
      : `${API_BASE_URL}/options?companyId=${companyId}`;
    console.log('옵션 조회 요청:', url);
    const response = await fetch(url, { method: 'GET', headers: headers() });
    console.log('옵션 조회 응답 상태:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('옵션 조회 실패:', errorText);
      throw new Error(`옵션 조회 실패 (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    console.log('옵션 조회 성공:', data);
    return data;
  } catch (error: any) {
    console.error('옵션 조회 에러:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (http://localhost:8080)');
    }
    throw error;
  }
}

// 제품별 variants 목록 조회
export async function fetchVariants(productId: number): Promise<ProductVariant[]> {
  try {
    const url = `${API_BASE_URL}/variants?productId=${productId}`;
    console.log('Variants 조회 요청:', url);
    const response = await fetch(url, { method: 'GET', headers: headers() });
    console.log('Variants 조회 응답 상태:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Variants 조회 실패:', errorText);
      throw new Error(`Variants 조회 실패 (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    console.log('Variants 조회 성공:', data);
    return data;
  } catch (error: any) {
    console.error('Variants 조회 에러:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (http://localhost:8080)');
    }
    throw error;
  }
}

// 회사별 색상 목록 조회
export async function fetchColors(companyId: number = 1): Promise<Color[]> {
  try {
    const url = `${API_BASE_URL}/colors?companyId=${companyId}`;
    console.log('색상 조회 요청:', url);
    const response = await fetch(url, { method: 'GET', headers: headers() });
    console.log('색상 조회 응답 상태:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('색상 조회 실패:', errorText);
      throw new Error(`색상 조회 실패 (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    console.log('색상 조회 성공:', data);
    return data;
  } catch (error: any) {
    console.error('색상 조회 에러:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (http://localhost:8080)');
    }
    throw error;
  }
}

// 견적 계산
export async function calculateEstimate(request: EstimateRequest): Promise<EstimateResponse> {
  const response = await fetch(`${API_BASE_URL}/estimates/calculate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || '견적 계산 실패');
  }
  
  return response.json();
}

