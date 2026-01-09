package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.Option;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OptionRepository extends JpaRepository<Option, Long> {
    // Company ID로 옵션 조회 (Category를 LEFT JOIN FETCH로 함께 조회 - Category가 null일 수 있음, id 순서로 정렬)
    @Query("SELECT o FROM Option o LEFT JOIN FETCH o.category WHERE o.company.id = :companyId ORDER BY o.id")
    List<Option> findByCompanyId(@Param("companyId") Long companyId);
    
    // Product ID로 옵션 조회 (제품별 옵션, id 순서로 정렬)
    @Query("SELECT DISTINCT o FROM Option o LEFT JOIN FETCH o.category LEFT JOIN FETCH o.product WHERE o.product IS NOT NULL AND o.product.id = :productId ORDER BY o.id")
    List<Option> findByProductId(@Param("productId") Long productId);
    
    // Category ID와 Product ID가 모두 null인 옵션 조회 (카테고리 전체 공통 옵션)
    @Query("SELECT o FROM Option o LEFT JOIN FETCH o.category WHERE o.company.id = :companyId AND o.category.id = :categoryId AND o.product IS NULL")
    List<Option> findByCompanyIdAndCategoryIdAndProductIsNull(@Param("companyId") Long companyId, @Param("categoryId") Long categoryId);
}
