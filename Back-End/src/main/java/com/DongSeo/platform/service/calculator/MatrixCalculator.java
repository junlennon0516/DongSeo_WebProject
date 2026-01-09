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
        if (request.getWidth() == null) {
            throw new IllegalArgumentException("가로폭을 입력해야 합니다.");
        }
        
        // 목창호인 경우: typeName을 optionName으로 사용
        String optionName;
        boolean isWindow = "WINDOW".equals(product.getCategory().getCode()) || 
            (product.getCategory().getParent() != null && "WINDOW".equals(product.getCategory().getParent().getCode()));
        
        if (isWindow) {
            // 목창호 제품의 경우 typeName을 optionName으로 사용
            optionName = request.getTypeName() != null ? request.getTypeName() : "미닫이 (80바)";
        } else {
            // 중문인 경우 기본 세트
            optionName = "기본 세트";
        }
        
        // 목창호인 경우 가로폭 기준으로 가격 매트릭스 찾기
        // (세로 높이는 옵션으로 처리되므로 가격 매트릭스는 가로폭만 체크)
        PricingMatrix matrix;
        if (isWindow) {
            // 목창호는 가로폭만 체크 (세로 높이는 옵션으로 추가 비용 처리)
            matrix = matrixRepository.findFirstByProductIdAndOptionNameAndMaxWidthGreaterThanEqualOrderByMaxWidthAsc(
                product.getId(), optionName, request.getWidth()
            ).orElseThrow(() -> new IllegalArgumentException(
                String.format("해당 사이즈(가로: %dmm)의 가격표가 없습니다.", request.getWidth())
            ));
        } else {
            // 중문인 경우 가로폭만 체크
            matrix = matrixRepository.findFirstByProductIdAndOptionNameAndMaxWidthGreaterThanEqualOrderByMaxWidthAsc(
                product.getId(), optionName, request.getWidth()
            ).orElseThrow(() -> new IllegalArgumentException(
                String.format("해당 사이즈(가로: %dmm)의 가격표가 없습니다.", request.getWidth())
            ));
        }

        return matrix.getPrice();
    }
}
