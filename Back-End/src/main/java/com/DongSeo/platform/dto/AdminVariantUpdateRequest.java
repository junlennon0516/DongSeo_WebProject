package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 규격(variant) 수정 요청
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminVariantUpdateRequest {
    private String specName;
    private String typeName;
    private Integer price;
}
