package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 견적서 PDF 출력용 장바구니 항목 DTO
 * 프론트엔드 CartItem과 대응
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstimatePdfItemDto {
    private String productName;
    private String categoryName;
    private String subCategoryName;
    private String specName;
    private String typeName;
    private String width;
    private String height;
    private String selectedColorName;
    private String selectedColorCode;
    private int unitPrice;
    private String priceIncreaseReason;   // 사이즈 인상 사유
    private String colorCostInfo;         // "색상명 (N% 인상)" 등
    private int optionPrice;
    private List<String> selectedOptions;
    private int quantity;
    private long baseTotal;               // 마진 적용 전
    private String margin;                // "10" 등
    private long marginAmount;
    private long finalTotal;
}
