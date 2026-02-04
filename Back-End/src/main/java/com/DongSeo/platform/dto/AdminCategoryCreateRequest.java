package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCategoryCreateRequest {
    private Long companyId;
    private String name;
    private String code;   // 선택, 없으면 name 기반 생성
    private Long parentId; // null이면 메인 카테고리
}
