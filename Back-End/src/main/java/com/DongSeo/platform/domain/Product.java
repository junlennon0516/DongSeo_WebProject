package com.DongSeo.platform.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String name; // 제품명

    private Integer basePrice = 0; // 기본 단가

    private String description;

    /** 목재 합판 등 규격 (예: 1220 × 2440mm, 910 × 1820mm) */
    private String size;

    /** 도어 등 제품별 규격: 최소/최대 폭(mm), null=제한없음 */
    private Integer minWidth;
    private Integer maxWidth;
    /** 도어 등 제품별 규격: 최소/최대 길이(높이, mm), null=제한없음 */
    private Integer minHeight;
    private Integer maxHeight;
}
