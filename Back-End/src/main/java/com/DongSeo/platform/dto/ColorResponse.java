package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ColorResponse {
    private Long id;
    private String name;
    private String colorCode;
    private java.math.BigDecimal cost; // 추가 비용 비율 (예: 0.1 = 10%)
    private CompanyInfo company;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyInfo {
        private Long id;
        private String name;
        private String code;
    }
}
