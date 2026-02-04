package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 관리자 제품 검색 결과 (수정/삭제용)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProductSearchResponse {
    private Long id;
    private String name;
    private String description;
    private String size;   // 목재 합판 규격
    private Integer basePrice;
    private Long companyId;
    private String companyName;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private List<VariantInfo> variants;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantInfo {
        private Long id;
        private String specName;
        private String typeName;
        private Integer price;
    }
}
