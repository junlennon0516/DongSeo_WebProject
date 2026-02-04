package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    // 특정 회사의 특정 카테고리 제품 목록 조회
    List<Product> findByCompanyIdAndCategoryCode(Long companyId, String categoryCode);

    // 특정 회사의 제품 목록 조회
    List<Product> findByCompanyId(Long companyId);
    
    // 카테고리 ID로 제품 목록 조회 (Category를 JOIN FETCH로 함께 조회, 중복 제거)
    @Query("SELECT DISTINCT p FROM Product p JOIN FETCH p.category WHERE p.category.id = :categoryId")
    List<Product> findByCategoryId(@Param("categoryId") Long categoryId);
    
    // 메인 카테고리와 그 하위 세부 카테고리의 모든 제품 조회 (회사 정보 포함)
    @Query("SELECT DISTINCT p FROM Product p JOIN FETCH p.category c LEFT JOIN FETCH p.company WHERE c.id = :categoryId OR c.parent.id = :categoryId")
    List<Product> findByCategoryIdOrParentCategoryId(@Param("categoryId") Long categoryId);
    
    // 제품 ID로 조회 (카테고리와 부모 카테고리 함께 조회)
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category c LEFT JOIN FETCH c.parent WHERE p.id = :productId")
    java.util.Optional<Product> findByIdWithCategoryAndParent(@Param("productId") Long productId);

    // 관리자 검색: 키워드(이름/설명), 회사, 카테고리 (선택)
    @Query("SELECT DISTINCT p FROM Product p JOIN FETCH p.category c JOIN FETCH p.company co " +
           "WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR (p.description IS NOT NULL AND LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))) " +
           "AND (:companyId IS NULL OR co.id = :companyId) " +
           "AND (:categoryId IS NULL OR c.id = :categoryId OR (c.parent IS NOT NULL AND c.parent.id = :categoryId)) " +
           "ORDER BY p.id")
    List<Product> searchForAdmin(@Param("keyword") String keyword, @Param("companyId") Long companyId, @Param("categoryId") Long categoryId);
}
