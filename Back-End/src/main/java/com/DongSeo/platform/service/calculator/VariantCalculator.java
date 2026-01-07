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
        return "FRAME".equals(categoryCode) || "MOLDING".equals(categoryCode);
    }

    @Override
    public int calculateBasePrice(Product product, EstimateRequest request) {
        ProductVariant variant = variantRepository.findByProductIdAndSpecNameAndTypeName(
            product.getId(), request.getSpecName(), request.getTypeName()
        ).orElseThrow(() -> new IllegalArgumentException("해당 규격의 제품이 없습니다."));

        return variant.getPrice();
    }
}
