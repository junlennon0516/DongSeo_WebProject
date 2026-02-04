package com.DongSeo.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCompanyCreateRequest {
    private String name;
    private String code; // 선택, 없으면 name 기반 생성
}
