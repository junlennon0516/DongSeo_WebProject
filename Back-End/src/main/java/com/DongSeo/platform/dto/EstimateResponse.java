package com.DongSeo.platform.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EstimateResponse {
    private String productName;
    private int unitPrice;      // 단가
    private int optionPrice;    // 옵션 합계
    private int quantity;       // 수량
    private int totalPrice;     // 최종 금액
}
