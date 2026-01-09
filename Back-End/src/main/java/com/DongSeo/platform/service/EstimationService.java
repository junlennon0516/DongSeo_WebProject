package com.DongSeo.platform.service;

import com.DongSeo.platform.domain.Option;
import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.dto.EstimateRequest;
import com.DongSeo.platform.dto.EstimateResponse;
import com.DongSeo.platform.repository.OptionRepository;
import com.DongSeo.platform.repository.ProductRepository;
import com.DongSeo.platform.service.calculator.PriceCalculator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EstimationService {

    private final ProductRepository productRepository;
    private final OptionRepository optionRepository;
    private final List<PriceCalculator> calculators;

    @Transactional
    public EstimateResponse calculate(EstimateRequest request) {
        // 1. 제품 조회
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("제품이 존재하지 않습니다."));

        // 2. 적절한 계산기 찾기 (Strategy Pattern)
        // 카테고리 코드 확인 (부모 카테고리도 체크)
        String categoryCode = product.getCategory().getCode();
        String parentCode = null;
        if (product.getCategory().getParent() != null) {
            parentCode = product.getCategory().getParent().getCode();
        }
        
        // 일반 목창호는 base_price가 있으면 BasicCalculator 우선 사용
        // 간살 목창호는 MatrixCalculator 사용
        // INTERLOCK 카테고리에서 product_variants가 있으면 VariantCalculator 우선 사용
        final String finalParentCode = parentCode;
        PriceCalculator calculator = null;
        
        // WINDOW 카테고리인 경우 base_price가 있으면 BasicCalculator 우선
        if (("WINDOW".equals(categoryCode) || "WINDOW".equals(finalParentCode)) 
            && product.getBasePrice() != null && product.getBasePrice() > 0) {
            calculator = calculators.stream()
                    .filter(c -> c instanceof com.DongSeo.platform.service.calculator.BasicCalculator)
                    .findFirst()
                    .orElse(null);
        }
        
        // INTERLOCK 카테고리에서 product_variants가 있으면 VariantCalculator 우선
        // (제품명에 "목재 3연동 중문"이 포함된 경우)
        if (calculator == null && ("INTERLOCK".equals(categoryCode) || "INTERLOCK".equals(finalParentCode))
            && product.getName() != null && product.getName().contains("목재 3연동 중문")) {
            calculator = calculators.stream()
                    .filter(c -> c instanceof com.DongSeo.platform.service.calculator.VariantCalculator)
                    .findFirst()
                    .orElse(null);
        }
        
        // 기본적으로 카테고리 코드로 계산기 찾기
        if (calculator == null) {
            calculator = calculators.stream()
                    .filter(c -> c.supports(categoryCode) || (finalParentCode != null && c.supports(finalParentCode)))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("해당 제품의 계산 로직이 없습니다."));
        }

        // 3. 기본 단가 계산
        int basePrice = calculator.calculateBasePrice(product, request);

        // 4. 추가 옵션 금액 합산
        int optionsTotal = 0;
        if (request.getOptionIds() != null && !request.getOptionIds().isEmpty()) {
            List<Option> selectedOptions = optionRepository.findAllById(request.getOptionIds());
            optionsTotal = selectedOptions.stream().mapToInt(Option::getAddPrice).sum();
        }

        // 5. 최종 금액 계산
        int unitPriceTotal = basePrice + optionsTotal;
        int finalPrice = unitPriceTotal * request.getQuantity();

        // 6. 응답 생성
        return EstimateResponse.builder()
                .productName(product.getName())
                .unitPrice(basePrice)
                .optionPrice(optionsTotal)
                .quantity(request.getQuantity())
                .totalPrice(finalPrice)
                .build();
    }

}