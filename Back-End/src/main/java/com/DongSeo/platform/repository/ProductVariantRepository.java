package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    Optional<ProductVariant> findByProductIdAndSpecNameAndTypeName(
            Long productId, String specName, String typeName
    );
    
    // 제품 ID로 모든 variants 조회 (DB id 순서로 정렬)
    @Query("SELECT DISTINCT v FROM ProductVariant v WHERE v.product.id = :productId ORDER BY v.id")
    List<ProductVariant> findByProductId(@Param("productId") Long productId);
}
