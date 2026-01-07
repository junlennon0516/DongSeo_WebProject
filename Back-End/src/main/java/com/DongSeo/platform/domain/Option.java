package com.DongSeo.platform.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "options")
@Getter
@NoArgsConstructor
public class Option {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id") // Null이면 전체 공통 옵션
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer addPrice; // 추가 금액

    // 특정 카테고리 전용인지 확인
    public boolean isGlobalOption() {
        return this.category == null;
    }
}
