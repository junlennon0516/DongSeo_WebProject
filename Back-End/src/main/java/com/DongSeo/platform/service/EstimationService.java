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
        PriceCalculator calculator = calculators.stream()
                .filter(c -> c.supports(product.getCategory().getCode()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 제품의 계산 로직이 없습니다."));

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