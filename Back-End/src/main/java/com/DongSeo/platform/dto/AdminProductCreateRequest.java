package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 제품 추가 요청
 * 카테고리, 회사, 이름 필수. 규격(description), 가격(basePrice) 선택.
 * 규격별 가격을 쓰려면 specName, typeName, variantPrice 사용.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductCreateRequest {
    private Long companyId;
    private Long categoryId;
    private String name;
    private String description;   // 규격/비고 (선택)
    private String size;          // 목재 합판 규격 (예: 1220 × 2440mm, 선택)
    private Integer basePrice;     // 기본 단가 (선택, 미입력 시 0)
    // 규격별 단가 추가 시 (선택)
    private String specName;
    private String typeName;
    private Integer variantPrice;
}
