package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.Color;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ColorRepository extends JpaRepository<Color, Long> {
    // Company ID로 색상 조회 (Company를 JOIN FETCH로 함께 조회, id 순서로 정렬)
    @Query("SELECT c FROM Color c JOIN FETCH c.company WHERE c.company.id = :companyId ORDER BY c.id")
    List<Color> findByCompanyId(@Param("companyId") Long companyId);
}
