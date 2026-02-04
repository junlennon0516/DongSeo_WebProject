import type { EstimateResponse } from "../api/estimateApi";

/**
 * 확장된 견적 결과 타입
 * 기본 EstimateResponse에 추가 정보를 포함합니다.
 */
export interface ExtendedEstimateResponse extends EstimateResponse {
  categoryName?: string;
  subCategoryName?: string;
  selectedOptions?: string[]; // 선택된 옵션 이름들
  priceIncreaseInfo?: { rate: number; reason: string }; // 사이즈로 인한 가격 인상 정보
  colorCostInfo?: { colorName: string; costRate: number }; // 색상 추가 비용 정보
  margin?: string; // 회사 마진 (%)
  marginAmount?: number; // 마진 금액
  finalPrice?: number; // 마진 적용 후 최종 가격
}

/**
 * 장바구니 항목 타입 (도어/문틀 견적)
 */
export interface CartItem extends ExtendedEstimateResponse {
  id: string; // 고유 ID
  width?: string; // 가로폭
  height?: string; // 세로높이
  specName?: string; // 규격명
  typeName?: string; // 타입명
  selectedColorId?: string; // 선택된 색상 ID
  selectedColorName?: string; // 선택된 색상 이름
  selectedColorCode?: string; // 선택된 색상 코드
}

/**
 * 목재 자재 장바구니 항목 타입
 */
export interface WoodProduct {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  margin?: string;
  marginAmount?: number;
  finalPrice?: number;
}

/**
 * 통합 장바구니 항목 (도어/문틀 + 목재)
 */
export type UnifiedCartItem =
  | { source: "estimate"; item: CartItem }
  | { source: "wood"; item: WoodProduct };
