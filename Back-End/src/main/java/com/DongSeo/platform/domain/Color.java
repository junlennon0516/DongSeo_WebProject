package com.DongSeo.platform.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "colors", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"company_id", "color_code"})
})
@Getter
@NoArgsConstructor
public class Color {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String name; // 색상명 (예: 빨강, 파랑, RAL-1001 등)

    @Column(name = "color_code")
    private String colorCode; // 색상 코드 (예: #FF0000, RAL-1001 등)

    @Column(name = "cost")
    private java.math.BigDecimal cost; // 추가 비용 비율 (예: 0.1 = 10%)

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Color(Company company, String name, String colorCode) {
        this.company = company;
        this.name = name;
        this.colorCode = colorCode;
    }
}
