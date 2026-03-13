package com.DongSeo.platform.service.calculator;

import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.domain.ProductVariant;
import com.DongSeo.platform.dto.EstimateRequest;
import com.DongSeo.platform.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class WoodinDoorCalculator implements PriceCalculator {

    private final ProductVariantRepository variantRepository;

    @Override
    public boolean supports(String categoryCode) {
        return categoryCode != null && (
                "WOODIN_ABS_DOOR".equals(categoryCode) ||
                categoryCode.startsWith("WOODIN_ABS_") ||
                "WOODIN_SIG_DOOR".equals(categoryCode) ||
                "WOODIN_HIDDEN_DOOR".equals(categoryCode) ||
                "WOODIN_HIDDEN_FRAME".equals(categoryCode)
        );
    }

    @Override
    public int calculateBasePrice(Product product, EstimateRequest request) {
        validateDoorDimensions(product, request);

        if (request.getSpecName() != null && request.getTypeName() != null) {
            Optional<ProductVariant> variant = variantRepository.findByProductIdAndSpecNameAndTypeName(
                    product.getId(),
                    request.getSpecName(),
                    request.getTypeName()
            );
            if (variant.isPresent()) {
                return variant.get().getPrice();
            }
        }

        if (product.getBasePrice() == null || product.getBasePrice() == 0) {
            throw new IllegalArgumentException("제품의 기본 단가가 설정되지 않았습니다.");
        }
        return product.getBasePrice();
    }

    /**
     * 제품에 규격(min/max 폭·길이)이 있으면 요청 폭·길이가 범위 내인지 검증.
     * 범위 밖이면 해당 제품 규격을 안내하는 메시지로 IllegalArgumentException 발생.
     */
    private void validateDoorDimensions(Product product, EstimateRequest request) {
        boolean hasSpec = product.getMinWidth() != null || product.getMaxWidth() != null
                || product.getMinHeight() != null || product.getMaxHeight() != null;
        if (!hasSpec) {
            return;
        }

        Integer width = request.getWidth();
        Integer height = request.getHeight();

        if (product.getMinWidth() != null && (width == null || width < product.getMinWidth())) {
            throw new IllegalArgumentException("해당 제품 규격을 벗어났습니다. " + formatSpec(product) + " (폭 " + (width != null ? width + "mm" : "미입력") + "는 최소 " + product.getMinWidth() + "mm 이상이어야 합니다.)");
        }
        if (product.getMaxWidth() != null && (width == null || width > product.getMaxWidth())) {
            throw new IllegalArgumentException("해당 제품 규격을 벗어났습니다. " + formatSpec(product) + " (폭 " + (width != null ? width + "mm" : "미입력") + "는 최대 " + product.getMaxWidth() + "mm 이하여야 합니다.)");
        }
        if (product.getMinHeight() != null && (height == null || height < product.getMinHeight())) {
            throw new IllegalArgumentException("해당 제품 규격을 벗어났습니다. " + formatSpec(product) + " (길이 " + (height != null ? height + "mm" : "미입력") + "는 최소 " + product.getMinHeight() + "mm 이상이어야 합니다.)");
        }
        if (product.getMaxHeight() != null && (height == null || height > product.getMaxHeight())) {
            throw new IllegalArgumentException("해당 제품 규격을 벗어났습니다. " + formatSpec(product) + " (길이 " + (height != null ? height + "mm" : "미입력") + "는 최대 " + product.getMaxHeight() + "mm 이하여야 합니다.)");
        }
    }

    private String formatSpec(Product product) {
        StringBuilder sb = new StringBuilder();
        if (product.getMinWidth() != null) sb.append("최소폭 ").append(product.getMinWidth()).append("mm");
        if (product.getMaxWidth() != null) sb.append(sb.length() > 0 ? ", " : "").append("최대폭 ").append(product.getMaxWidth()).append("mm");
        if (product.getMinHeight() != null) sb.append(sb.length() > 0 ? ", " : "").append("최소길이 ").append(product.getMinHeight()).append("mm");
        if (product.getMaxHeight() != null) sb.append(sb.length() > 0 ? ", " : "").append("최대길이 ").append(product.getMaxHeight()).append("mm");
        return sb.toString();
    }
}
