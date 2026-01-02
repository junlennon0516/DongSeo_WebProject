package com.DongSeo.platform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter
@NoArgsConstructor
public class Company {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // 회사명

    @Column(nullable = false, unique = true)
    private String code; // 회사 코드

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Company(String name, String code) {
        this.name = name;
        this.code = code;
    }
}
