const API_BASE_URL = 'http://localhost:8080/api';

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

// 서버 연결 확인
export async function checkServerConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/estimates/ping`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 카테고리 목록 조회
export async function fetchCategories(companyId: number = 1): Promise<Category[]> {
  try {
    const url = `${API_BASE_URL}/categories?companyId=${companyId}`;
    console.log('카테고리 조회 요청:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('카테고리 조회 응답 상태:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('카테고리 조회 실패:', errorText);
      throw new Error(`카테고리 조회 실패 (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    console.log('카테고리 조회 성공:', data);
    return data;
  } catch (error: any) {
    console.error('카테고리 조회 에러:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (http://localhost:8080)');
    }
    throw error;
  }
}

// 카테고리별 제품 목록 조회
export async function fetchProducts(categoryId: number): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products?categoryId=${categoryId}`);
    if (!response.ok) {
      throw new Error(`제품 조회 실패 (${response.status})`);
    }
    return response.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('백엔드 서버에 연결할 수 없습니다.');
    }
    throw error;
  }
}

// 카테고리별 옵션 목록 조회
export async function fetchOptions(categoryId: number | null, companyId: number = 1): Promise<Option[]> {
  try {
    const url = categoryId 
      ? `${API_BASE_URL}/options?categoryId=${categoryId}&companyId=${companyId}`
      : `${API_BASE_URL}/options?companyId=${companyId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`옵션 조회 실패 (${response.status})`);
    }
    return response.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('백엔드 서버에 연결할 수 없습니다.');
    }
    throw error;
  }
}

// 견적 계산
export async function calculateEstimate(request: EstimateRequest): Promise<EstimateResponse> {
  const response = await fetch(`${API_BASE_URL}/estimates/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || '견적 계산 실패');
  }
  
  return response.json();
}

