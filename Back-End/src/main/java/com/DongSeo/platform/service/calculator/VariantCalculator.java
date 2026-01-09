package com.DongSeo.platform.service.calculator;

import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.domain.ProductVariant;
import com.DongSeo.platform.dto.EstimateRequest;
import com.DongSeo.platform.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VariantCalculator implements PriceCalculator {

    private final ProductVariantRepository variantRepository;

    @Override
    public boolean supports(String categoryCode){
        return "FRAME".equals(categoryCode) || "MOLDING".equals(categoryCode) || "FILM".equals(categoryCode) || "INTERLOCK".equals(categoryCode);
    }

    @Override
    public int calculateBasePrice(Product product, EstimateRequest request) {
        ProductVariant variant = variantRepository.findByProductIdAndSpecNameAndTypeName(
            product.getId(), request.getSpecName(), request.getTypeName()
        ).orElseThrow(() -> new IllegalArgumentException("해당 규격의 제품이 없습니다."));

        // 목재문틀인 경우: 才(사이) 계산 필요
        // 才 = (가로 x 세로) / 900,000
        // 최종 가격 = 才 x (才당 단가)
        if (product.getName() != null && product.getName().contains("목재문틀")) {
            if (request.getWidth() == null || request.getHeight() == null) {
                throw new IllegalArgumentException("목재문틀은 가로와 세로를 입력해야 합니다.");
            }
            
            // 才 계산: (가로 x 세로) / 900,000
            double sae = (request.getWidth() * request.getHeight()) / 900000.0;
            // 才당 단가
            int pricePerSae = variant.getPrice();
            // 최종 가격 = 才 x 才당 단가 (소수점 반올림)
            return (int) Math.round(sae * pricePerSae);
        }

        // 일반 제품 (PVC 발포문틀, 슬림문틀, 몰딩 등)은 variant의 가격 그대로 반환
        return variant.getPrice();
    }
}
