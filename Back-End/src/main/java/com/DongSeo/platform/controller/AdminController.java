package com.DongSeo.platform.controller;

import com.DongSeo.platform.domain.Category;
import com.DongSeo.platform.domain.Company;
import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.domain.ProductVariant;
import com.DongSeo.platform.dto.*;
import com.DongSeo.platform.repository.CategoryRepository;
import com.DongSeo.platform.repository.CompanyRepository;
import com.DongSeo.platform.repository.ProductRepository;
import com.DongSeo.platform.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import static java.util.Optional.ofNullable;

/**
 * 직원/관리자 전용 API - 제품(가구·목재 등) 추가, 수정, 삭제
 * /api/admin/** 는 STAFF, ADMIN 역할만 접근 가능 (SecurityConfig)
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final CompanyRepository companyRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    private static String toCode(String name) {
        if (name == null || name.isBlank()) return "ITEM";
        String c = name.trim().replaceAll("\\s+", "_").toUpperCase().replaceAll("[^A-Z0-9_]", "");
        return c.length() > 50 ? c.substring(0, 50) : (c.isEmpty() ? "ITEM" : c);
    }

    /**
     * 회사 목록 (추가 폼 드롭다운용)
     */
    @GetMapping("/companies")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CompanyResponse>> getCompanies() {
        List<Company> list = companyRepository.findAllByOrderByIdAsc();
        List<CompanyResponse> res = list.stream()
                .map(c -> new CompanyResponse(c.getId(), c.getName(), c.getCode()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(res);
    }

    /**
     * 회사 생성 (이름만 입력 시 코드 자동 생성)
     */
    @PostMapping("/companies")
    @Transactional
    public ResponseEntity<CompanyResponse> createCompany(@RequestBody AdminCompanyCreateRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String name = request.getName().trim();
        String code = ofNullable(request.getCode()).map(String::trim).filter(s -> !s.isEmpty()).orElseGet(() -> toCode(name));
        if (companyRepository.findByCode(code).isPresent()) {
            code = code + "_" + System.currentTimeMillis();
        }
        Company company = new Company(name, code);
        company = companyRepository.save(company);
        return ResponseEntity.ok(new CompanyResponse(company.getId(), company.getName(), company.getCode()));
    }

    /**
     * 카테고리 생성 (메인 또는 세부, 이름만 입력 시 코드 자동 생성)
     */
    @PostMapping("/categories")
    @Transactional
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody AdminCategoryCreateRequest request) {
        if (request.getCompanyId() == null || request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new IllegalArgumentException("회사를 찾을 수 없습니다."));
        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 카테고리를 찾을 수 없습니다."));
        }
        String name = request.getName().trim();
        String code = ofNullable(request.getCode()).map(String::trim).filter(s -> !s.isEmpty()).orElseGet(() -> toCode(name));
        if (categoryRepository.findByCompanyIdAndCode(company.getId(), code).isPresent()) {
            code = code + "_" + System.currentTimeMillis();
        }
        Category category = new Category(code, company, name);
        category = categoryRepository.save(category);
        if (parent != null) {
            category.setParent(parent);
            category = categoryRepository.save(category);
        }
        return ResponseEntity.ok(new CategoryResponse(category.getId(), category.getName(), category.getCode()));
    }

    /**
     * 제품 추가
     * 카테고리, 회사, 이름 필수. 규격(description), 가격(basePrice) 선택.
     * variant 정보(specName, typeName, variantPrice)가 있으면 규격 한 건도 추가.
     */
    @PostMapping("/products")
    @Transactional
    public ResponseEntity<ProductResponse> createProduct(@RequestBody AdminProductCreateRequest request) {
        if (request.getCompanyId() == null || request.getCategoryId() == null || request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new IllegalArgumentException("회사를 찾을 수 없습니다."));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));

        Product product = new Product();
        product.setCompany(company);
        product.setCategory(category);
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        product.setSize(request.getSize() != null ? request.getSize().trim() : null);
        product.setBasePrice(request.getBasePrice() != null ? request.getBasePrice() : 0);
        product = productRepository.save(product);

        if (request.getSpecName() != null && !request.getSpecName().isBlank() && request.getVariantPrice() != null) {
            ProductVariant v = new ProductVariant();
            v.setProduct(product);
            v.setSpecName(request.getSpecName().trim());
            v.setTypeName(request.getTypeName() != null ? request.getTypeName().trim() : "");
            v.setPrice(request.getVariantPrice());
            productVariantRepository.save(v);
        }

        ProductResponse.CategoryInfo catInfo = new ProductResponse.CategoryInfo(
                category.getId(), category.getName(), category.getCode());
        return ResponseEntity.ok(new ProductResponse(
                product.getId(), product.getName(), product.getBasePrice(), product.getDescription(), product.getSize(),
                company.getId(), company.getName(), catInfo));
    }

    /**
     * 제품 검색 (키워드, 회사, 카테고리 - 선택)
     * 수정/삭제할 항목 찾기용
     */
    @GetMapping("/products/search")
    @Transactional(readOnly = true)
    public ResponseEntity<List<AdminProductSearchResponse>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long categoryId) {
        String q = (keyword != null && keyword.isBlank()) ? null : keyword;
        List<Product> products = productRepository.searchForAdmin(q, companyId, categoryId);
        List<AdminProductSearchResponse> list = products.stream()
                .map(p -> {
                    List<AdminProductSearchResponse.VariantInfo> variants = productVariantRepository.findByProductId(p.getId())
                            .stream()
                            .map(v -> new AdminProductSearchResponse.VariantInfo(v.getId(), v.getSpecName(), v.getTypeName(), v.getPrice()))
                            .collect(Collectors.toList());
                    return AdminProductSearchResponse.builder()
                            .id(p.getId())
                            .name(p.getName())
                            .description(p.getDescription())
                            .size(p.getSize())
                            .basePrice(p.getBasePrice())
                            .companyId(p.getCompany().getId())
                            .companyName(p.getCompany().getName())
                            .categoryId(p.getCategory().getId())
                            .categoryName(p.getCategory().getName())
                            .categoryCode(p.getCategory().getCode())
                            .variants(variants)
                            .build();
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    /**
     * 제품 수정 (이름, 규격/설명, 기본가격)
     */
    @PutMapping("/products/{id}")
    @Transactional
    public ResponseEntity<Void> updateProduct(@PathVariable Long id, @RequestBody AdminProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("제품을 찾을 수 없습니다."));
        if (request.getName() != null && !request.getName().isBlank()) {
            product.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription().trim().isEmpty() ? null : request.getDescription().trim());
        }
        if (request.getSize() != null) {
            product.setSize(request.getSize().trim().isEmpty() ? null : request.getSize().trim());
        }
        if (request.getBasePrice() != null) {
            product.setBasePrice(request.getBasePrice());
        }
        productRepository.save(product);
        return ResponseEntity.ok().build();
    }

    /**
     * 규격(variant) 수정
     */
    @PutMapping("/products/variants/{id}")
    @Transactional
    public ResponseEntity<Void> updateVariant(@PathVariable Long id, @RequestBody AdminVariantUpdateRequest request) {
        ProductVariant v = productVariantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("규격을 찾을 수 없습니다."));
        if (request.getSpecName() != null) {
            v.setSpecName(request.getSpecName().trim());
        }
        if (request.getTypeName() != null) {
            v.setTypeName(request.getTypeName().trim());
        }
        if (request.getPrice() != null) {
            v.setPrice(request.getPrice());
        }
        productVariantRepository.save(v);
        return ResponseEntity.ok().build();
    }

    /**
     * 제품 삭제 (관련 규격(variants) 함께 삭제)
     */
    @DeleteMapping("/products/{id}")
    @Transactional
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("제품을 찾을 수 없습니다."));
        productVariantRepository.findByProductId(id).forEach(productVariantRepository::delete);
        productRepository.delete(product);
        return ResponseEntity.ok().build();
    }

    /**
     * 규격(variant)만 삭제
     */
    @DeleteMapping("/products/variants/{id}")
    @Transactional
    public ResponseEntity<Void> deleteVariant(@PathVariable Long id) {
        ProductVariant v = productVariantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("규격을 찾을 수 없습니다."));
        productVariantRepository.delete(v);
        return ResponseEntity.ok().build();
    }
}
