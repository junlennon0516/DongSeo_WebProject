package com.DongSeo.platform.service.calculator;

import com.DongSeo.platform.domain.PricingMatrix;
import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.dto.EstimateRequest;
import com.DongSeo.platform.repository.PricingMatrixRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MatrixCalculator implements PriceCalculator {

    private final PricingMatrixRepository matrixRepository;

    @Override
    public boolean supports(String categoryCode) {
        // 중문(INTERLOCK)이나 창호(WINDOW)일 때 동작
        return "INTERLOCK".equals(categoryCode) || "WINDOW".equals(categoryCode);
    }

    @Override
    public int calculateBasePrice(Product product, EstimateRequest request) {
        // 1. 기본 세트 가격 찾기 (옵션명은 비즈니스 로직에 따라 상수로 관리하거나 요청에서 받음)
        // 여기서는 '기본세트'라고 가정
        PricingMatrix matrix = matrixRepository.findFirstByProductIdAndOptionNameAndMaxWidthGreaterThanEqualOrderByMaxWidthAsc(
            product.getId(), "기본 세트", request.getWidth()
        ).orElseThrow(() -> new IllegalArgumentException("해당 사이즈의 가격표가 없습니다."));

        return matrix.getPrice();
    }
}
