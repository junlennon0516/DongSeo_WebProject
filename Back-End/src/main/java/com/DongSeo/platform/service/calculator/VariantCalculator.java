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
        return "FRAME".equals(categoryCode) || "MOLDING".equals(categoryCode) || "FILM".equals(categoryCode) || "INTERLOCK".equals(categoryCode)
            || "FOAM_FRAME".equals(categoryCode) || "SLIM_FRAME".equals(categoryCode) || "WOOD_FRAME_GIRD".equals(categoryCode) || "FRAME_WINDOW".equals(categoryCode);
    }

    @Override
    public int calculateBasePrice(Product product, EstimateRequest request) {
        ProductVariant variant = variantRepository.findByProductIdAndSpecNameAndTypeName(
            product.getId(), request.getSpecName(), request.getTypeName()
        ).orElseThrow(() -> new IllegalArgumentException("해당 규격의 제품이 없습니다."));

        // 우딘 목재 문틀: 기본 기준 1050 x 2100 이하
        // 2100 초과 ~ 2400 이하는 문틀폭(spec) 기준 추가금 적용
        if (product.getName() != null && (product.getName().contains("목재문틀") || product.getName().contains("목재 문틀"))) {
            if (request.getWidth() == null || request.getHeight() == null) {
                throw new IllegalArgumentException("목재문틀은 가로와 세로를 입력해야 합니다.");
            }

            if (request.getWidth() > 1050) {
                throw new IllegalArgumentException("목재문틀은 가로 1050mm 이하 기준으로 계산됩니다.");
            }
            if (request.getHeight() > 2400) {
                throw new IllegalArgumentException("목재문틀은 세로 2400mm 이하만 계산 가능합니다.");
            }

            int basePrice = variant.getPrice();
            if (request.getHeight() <= 2100) {
                return basePrice;
            }

            int specWidth = parseSpecWidth(request.getSpecName());
            return basePrice + getWoodFrameHeightSurcharge(specWidth);
        }

        // 일반 제품 (PVC 발포문틀, 슬림문틀, 몰딩 등)은 variant의 가격 그대로 반환
        return variant.getPrice();
    }

    private int parseSpecWidth(String specName) {
        try {
            return Integer.parseInt(specName);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("목재문틀 규격이 올바르지 않습니다.");
        }
    }

    private int getWoodFrameHeightSurcharge(int specWidth) {
        if (specWidth >= 110 && specWidth <= 140) return 5000;
        if (specWidth >= 150 && specWidth <= 170) return 7000;
        if (specWidth >= 180 && specWidth <= 200) return 10000;
        if (specWidth >= 210 && specWidth <= 250) return 12000;
        return 0;
    }
}
