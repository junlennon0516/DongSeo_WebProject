package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.PricingMatrix;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PricingMatrixRepository extends JpaRepository<PricingMatrix, Long> {
    // 입력된 가로폭(width)보다 크거나 같은 구간 중 가장 작은 값 1개 찾기
    Optional<PricingMatrix> findFirstByProductIdAndOptionNameAndMaxWidthGreaterThanEqualOrderByMaxWidthAsc(
            Long productId, String optionName, Integer width
    );
    
    // 가로폭과 세로 높이를 모두 체크하여 적합한 가격 매트릭스 찾기
    @Query("SELECT m FROM PricingMatrix m " +
           "WHERE m.product.id = :productId " +
           "AND m.optionName = :optionName " +
           "AND m.maxWidth >= :width " +
           "AND m.maxHeight >= :height " +
           "ORDER BY m.maxWidth ASC, m.maxHeight ASC")
    Optional<PricingMatrix> findFirstByProductIdAndOptionNameAndWidthAndHeight(
            @Param("productId") Long productId,
            @Param("optionName") String optionName,
            @Param("width") Integer width,
            @Param("height") Integer height
    );
}