package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 제품 수정 요청 (이름, 규격, 가격 등 - 변경할 필드만 전달)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductUpdateRequest {
    private String name;
    private String description;
    private String size;   // 목재 합판 규격
    private Integer basePrice;
}
