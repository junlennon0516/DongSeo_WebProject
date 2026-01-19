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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 견적 계산 서비스
 * 제품, 옵션, 수량 등을 기반으로 견적을 계산합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EstimationService {

    private final ProductRepository productRepository;
    private final OptionRepository optionRepository;
    private final List<PriceCalculator> calculators;

    /**
     * 견적 계산
     * 
     * @param request 견적 요청 정보
     * @return 계산된 견적 결과
     * @throws IllegalArgumentException 제품이 존재하지 않거나 계산 로직이 없는 경우
     */
    @Transactional
    public EstimateResponse calculate(EstimateRequest request) {
        log.debug("견적 계산 시작: productId={}, quantity={}", request.getProductId(), request.getQuantity());
        
        // 1. 제품 조회
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> {
                    log.error("제품을 찾을 수 없음: productId={}", request.getProductId());
                    return new IllegalArgumentException("제품이 존재하지 않습니다.");
                });

        // 2. 카테고리 코드 확인
        String categoryCode = product.getCategory().getCode();
        String parentCode = (product.getCategory().getParent() != null)
                ? product.getCategory().getParent().getCode()
                : null;

        // 3. 적절한 계산기 선택 (우선순위 순서)
        PriceCalculator calculator = selectCalculator(product, categoryCode, parentCode);
        
        log.debug("선택된 계산기: {}, productId={}", calculator.getClass().getSimpleName(), product.getId());

        // 4. 기본 단가 계산
        int basePrice = calculator.calculateBasePrice(product, request);
        log.debug("기본 단가 계산 완료: basePrice={}, productId={}", basePrice, product.getId());

        // 5. 추가 옵션 금액 합산
        int optionsTotal = calculateOptionsTotal(request.getOptionIds());
        log.debug("옵션 금액 계산 완료: optionsTotal={}", optionsTotal);

        // 6. 최종 금액 계산
        int unitPriceTotal = basePrice + optionsTotal;
        int finalPrice = unitPriceTotal * request.getQuantity();
        log.info("견적 계산 완료: productId={}, unitPrice={}, optionsTotal={}, quantity={}, totalPrice={}",
                product.getId(), basePrice, optionsTotal, request.getQuantity(), finalPrice);

        // 7. 응답 생성
        return EstimateResponse.builder()
                .productName(product.getName())
                .unitPrice(basePrice)
                .optionPrice(optionsTotal)
                .quantity(request.getQuantity())
                .totalPrice(finalPrice)
                .build();
    }
    
    /**
     * 적절한 계산기 선택
     * 제품의 카테고리와 특성에 따라 적절한 PriceCalculator를 선택합니다.
     */
    private PriceCalculator selectCalculator(Product product, String categoryCode, String parentCode) {
        final String finalParentCode = parentCode;
        
        // 간살 목창호는 MatrixCalculator 우선 사용
        if (isGansalWindow(product, categoryCode, finalParentCode)) {
            return calculators.stream()
                    .filter(c -> c instanceof com.DongSeo.platform.service.calculator.MatrixCalculator)
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("간살 목창호 계산기를 찾을 수 없습니다."));
        }
        
        // WINDOW 카테고리인 경우 base_price가 있으면 BasicCalculator 우선
        if (isWindowWithBasePrice(product, categoryCode, finalParentCode)) {
            return calculators.stream()
                    .filter(c -> c instanceof com.DongSeo.platform.service.calculator.BasicCalculator)
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("기본 계산기를 찾을 수 없습니다."));
        }
        
        // INTERLOCK 카테고리에서 목재 3연동 중문인 경우 VariantCalculator 우선
        if (isWoodInterlock(product, categoryCode, finalParentCode)) {
            return calculators.stream()
                    .filter(c -> c instanceof com.DongSeo.platform.service.calculator.VariantCalculator)
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("변형 계산기를 찾을 수 없습니다."));
        }
        
        // 기본적으로 카테고리 코드로 계산기 찾기
        return calculators.stream()
                .filter(c -> c.supports(categoryCode) || (finalParentCode != null && c.supports(finalParentCode)))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 제품의 계산 로직이 없습니다."));
    }
    
    /**
     * 간살 목창호 여부 확인
     */
    private boolean isGansalWindow(Product product, String categoryCode, String parentCode) {
        return ("WINDOW".equals(categoryCode) || "WINDOW".equals(parentCode))
                && product.getName() != null
                && product.getName().contains("간살");
    }
    
    /**
     * base_price가 있는 WINDOW 제품 여부 확인
     */
    private boolean isWindowWithBasePrice(Product product, String categoryCode, String parentCode) {
        return ("WINDOW".equals(categoryCode) || "WINDOW".equals(parentCode))
                && product.getBasePrice() != null
                && product.getBasePrice() > 0;
    }
    
    /**
     * 목재 3연동 중문 여부 확인
     */
    private boolean isWoodInterlock(Product product, String categoryCode, String parentCode) {
        return ("INTERLOCK".equals(categoryCode) || "INTERLOCK".equals(parentCode))
                && product.getName() != null
                && product.getName().contains("목재 3연동 중문");
    }
    
    /**
     * 옵션 금액 합산
     */
    private int calculateOptionsTotal(List<Long> optionIds) {
        if (optionIds == null || optionIds.isEmpty()) {
            return 0;
        }
        
        List<Option> selectedOptions = optionRepository.findAllById(optionIds);
        return selectedOptions.stream()
                .mapToInt(Option::getAddPrice)
                .sum();
    }

}