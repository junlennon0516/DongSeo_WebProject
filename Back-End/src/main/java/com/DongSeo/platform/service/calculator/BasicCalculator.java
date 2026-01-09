package com.DongSeo.platform.service.calculator;

import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.dto.EstimateRequest;
import org.springframework.stereotype.Component;

@Component
public class BasicCalculator implements PriceCalculator {
    @Override
    public boolean supports(String categoryCode) {
        // DOOR로 시작하는 모든 카테고리 지원 (DOOR, DOOR_BASIC, DOOR_NATURAL 등)
        // WINDOW 카테고리도 지원 (일반 목창호는 base_price 사용)
        // HARDWARE 카테고리 및 하위 세부 카테고리들도 base_price 사용
        return categoryCode != null && (
            categoryCode.startsWith("DOOR") || 
            "WINDOW".equals(categoryCode) ||
            "HARDWARE".equals(categoryCode) ||
            "DOORLOCK".equals(categoryCode) ||
            "RECESSED_HANDLE".equals(categoryCode) ||
            "EASY_HINGE".equals(categoryCode) ||
            "PULL_HANDLE".equals(categoryCode) ||
            "DOOR_STOPPER".equals(categoryCode) ||
            "PACKAGING_FILM".equals(categoryCode) ||
            "OTHER_HARDWARE".equals(categoryCode) ||
            "HANGER_HARDWARE".equals(categoryCode)
        );
    }

    @Override
    public int calculateBasePrice(Product product, EstimateRequest request) {
        // 도어 제품 또는 일반 목창호 제품은 base_price를 그대로 반환
        // 수량은 EstimationService에서 처리됨
        if (product.getBasePrice() == null || product.getBasePrice() == 0) {
            throw new IllegalArgumentException("제품의 기본 단가가 설정되지 않았습니다.");
        }
        return product.getBasePrice();
    }
}
