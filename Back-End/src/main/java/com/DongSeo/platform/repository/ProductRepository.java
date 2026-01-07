package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    // 특정 회사의 특정 카테고리 제품 목록 조회
    List<Product> findByCompanyIdAndCategoryCode(Long companyId, String categoryCode);

    // 특정 회사의 제품 목록 조회
    List<Product> findByCompanyId(Long companyId);
    
    // 카테고리 ID로 제품 목록 조회
    List<Product> findByCategoryId(Long categoryId);
}
