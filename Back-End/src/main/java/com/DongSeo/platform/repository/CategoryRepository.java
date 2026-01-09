package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    @Query("SELECT c FROM Category c WHERE c.company.id = :companyId")
    List<Category> findByCompanyId(@Param("companyId") Long companyId);
    
    @Query("SELECT c FROM Category c WHERE c.company.id = :companyId AND c.parent IS NULL")
    List<Category> findMainCategoriesByCompanyId(@Param("companyId") Long companyId);
    
    @Query("SELECT c FROM Category c WHERE c.parent.id = :parentId")
    List<Category> findByParentId(@Param("parentId") Long parentId);
}




