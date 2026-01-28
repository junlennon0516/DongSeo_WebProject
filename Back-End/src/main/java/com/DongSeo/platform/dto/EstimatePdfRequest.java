package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 견적서 PDF export API 요청 DTO
 * 프론트엔드 장바구니 + 총액 정보
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstimatePdfRequest {
    private String companyName;           // 예: "쉐누 (CHENOUS)"
    private String dateStr;               // 작성일 포맷 문자열
    private List<EstimatePdfItemDto> items;
    private long baseTotal;               // 마진 적용 전 총액
    private long totalMargin;             // 총 마진 금액
    private String marginPercent;         // "10" 등
    private long totalPrice;              // 총 예상 금액
}
