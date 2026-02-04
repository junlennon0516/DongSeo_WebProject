package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    List<Company> findAllByOrderByIdAsc();
    java.util.Optional<Company> findByCode(String code);
}
