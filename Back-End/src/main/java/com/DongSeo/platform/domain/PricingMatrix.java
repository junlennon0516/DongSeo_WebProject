package com.DongSeo.platform.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "price_matrix")
@Getter
@NoArgsConstructor
public class PricingMatrix {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private String optionName; // 옵션명 (예: 투명유리)

    private Integer maxWidth = 99999; // ~이하

    private Integer maxHeight = 99999; // ~이하

    @Column(nullable = false)
    private Integer price;
}
