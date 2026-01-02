package com.DongSeo.platform.Repository;

import com.DongSeo.platform.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    // 특정 회사의 특정 카테고리 제품 목록 조회
    List<Product> findByCompanyIdAndCategoryCode(Long companyId, String categoryCode);
}
