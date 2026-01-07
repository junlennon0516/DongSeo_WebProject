package com.DongSeo.platform.service.calculator;

import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.dto.EstimateRequest;

public interface PriceCalculator {
    boolean supports(String categoryCode);

    int calculateBasePrice(Product product, EstimateRequest request);
}
