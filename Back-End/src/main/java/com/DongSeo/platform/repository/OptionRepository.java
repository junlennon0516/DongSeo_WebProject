package com.DongSeo.platform.repository;

import com.DongSeo.platform.domain.Option;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OptionRepository extends JpaRepository<Option, Long> {
    List<Option> findByCompanyId(Long companyId);
}
