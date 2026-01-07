package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.PricingMatrix;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PricingMatrixRepository extends JpaRepository<PricingMatrix, Long> {
    // 입력된 가로폭(width)보다 크거나 같은 구간 중 가장 작은 값 1개 찾기
    Optional<PricingMatrix> findFirstByProductIdAndOptionNameAndMaxWidthGreaterThanEqualOrderByMaxWidthAsc(
            Long productId, String optionName, Integer width
    );
}