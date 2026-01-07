package com.DongSeo.platform.service.calculator;

import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.dto.EstimateRequest;
import org.springframework.stereotype.Component;

@Component
public class BasicCalculator implements PriceCalculator {
    @Override
    public boolean supports(String categoryCode) {
        return "DOOR".equals(categoryCode);
    }

    @Override
    public int calculateBasePrice(Product product, EstimateRequest request) {
        return product.getBasePrice();
    }
}
