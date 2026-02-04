package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private Integer basePrice;
    private String description;
    private String size;   // 목재 합판 규격
    private Long companyId;   // 회사 ID (목재 등 회사명 표시용)
    private String companyName;
    private CategoryInfo category;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryInfo {
        private Long id;
        private String name;
        private String code;
    }
}

