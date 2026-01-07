package com.DongSeo.platform.dto;

import java.util.List;

public class EstimateRequest {
    private Long companyId; // 회사 ID
    private Long productId; // 제품 ID

    // 규격 선택 (문틀/몰딩용)
    private String specName;
    private String typeName;

    // 사이즈 입력 (중문/창호용)
    private Integer width;
    private Integer height;

    // 선택한 옵션 ID 목록
    private List<Long> optionIds;

    private Integer quantity;

    public Long getCompanyId() {
        return companyId;
    }

    public Integer getHeight() {
        return height;
    }

    public List<Long> getOptionIds() {
        return optionIds;
    }

    public Long getProductId() {
        return productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public String getSpecName() {
        return specName;
    }

    public String getTypeName() {
        return typeName;
    }

    public Integer getWidth() {
        return width;
    }
}
