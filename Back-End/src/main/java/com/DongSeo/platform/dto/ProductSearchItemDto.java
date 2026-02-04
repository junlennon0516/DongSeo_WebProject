package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 견적 계산기 검색 결과 한 건 (카테고리/세부 카테고리 설정용)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchItemDto {
    private Long productId;
    private String productName;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;   // 목재 탭 등에서 필터링용 (예: WOOD_)
    private Long parentCategoryId; // null이면 메인 카테고리
    private Long companyId;         // 목재 합판 등 회사 정보
    private String companyName;
    private String size;            // 목재 합판 규격 (예: 1220 × 2440mm)
}
