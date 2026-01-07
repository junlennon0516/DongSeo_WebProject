package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    Optional<ProductVariant> findByProductIdAndSpecNameAndTypeName(
            Long productId, String specName, String typeName
    );
}
