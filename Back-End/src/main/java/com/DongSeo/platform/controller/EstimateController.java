package com.DongSeo.platform.controller;

import com.DongSeo.platform.domain.Category;
import com.DongSeo.platform.domain.Option;
import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.domain.ProductVariant;
import com.DongSeo.platform.dto.*;
import com.DongSeo.platform.repository.CategoryRepository;
import com.DongSeo.platform.repository.OptionRepository;
import com.DongSeo.platform.repository.ProductRepository;
import com.DongSeo.platform.repository.ProductVariantRepository;
import com.DongSeo.platform.service.EstimationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EstimateController {

    private final EstimationService estimateService;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OptionRepository optionRepository;
    private final ProductVariantRepository productVariantRepository;

    // 1. 견적 계산 api
    // 요청: POST http://localhost:8080/api/estimates/calculate
    @PostMapping("/estimates/calculate")
    public ResponseEntity<EstimateResponse> calculateEstimate(@RequestBody EstimateRequest request) {
        // 서비스 로직
        EstimateResponse response = estimateService.calculate(request);

        // 결과 반환
        return ResponseEntity.ok(response);
    }

    // 2. 서버 상태 확인용 (Health Check)
    // 요청: GET http://localhost:8080/api/estimates/ping
    @GetMapping("/estimates/ping")
    public String ping() {
        return "Chenu Estimate System is Running!";
    }

    // 3. 메인 카테고리 목록 조회 (parent가 null인 카테고리만)
    // 요청: GET http://localhost:8080/api/categories?companyId=1
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories(@RequestParam(required = false) Long companyId) {
        try {
            System.out.println("메인 카테고리 조회 요청 - companyId: " + companyId);
            List<Category> categories;
            if (companyId != null) {
                categories = categoryRepository.findMainCategoriesByCompanyId(companyId);
            } else {
                // companyId가 없으면 모든 메인 카테고리 조회 (디버깅용)
                categories = categoryRepository.findAll().stream()
                        .filter(c -> c.getParent() == null)
                        .collect(Collectors.toList());
            }
            System.out.println("조회된 메인 카테고리 개수: " + categories.size());
            List<CategoryResponse> responses = categories.stream()
                    .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getCode()))
                    .collect(Collectors.toList());
            System.out.println("반환할 카테고리 응답 개수: " + responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            System.err.println("카테고리 조회 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    // 3-1. 세부 카테고리 목록 조회 (parent_id로 필터링)
    // 요청: GET http://localhost:8080/api/subcategories?parentId=1
    @GetMapping("/subcategories")
    public ResponseEntity<List<CategoryResponse>> getSubCategories(@RequestParam Long parentId) {
        try {
            System.out.println("세부 카테고리 조회 요청 - parentId: " + parentId);
            List<Category> subCategories = categoryRepository.findByParentId(parentId);
            System.out.println("조회된 세부 카테고리 개수: " + subCategories.size());
            List<CategoryResponse> responses = subCategories.stream()
                    .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getCode()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            System.err.println("세부 카테고리 조회 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // 4. 카테고리별 제품 목록 조회
    // 요청: GET http://localhost:8080/api/products?categoryId=1
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getProducts(@RequestParam Long categoryId) {
        System.out.println("제품 조회 요청 - categoryId: " + categoryId);
        // 메인 카테고리인 경우 하위 세부 카테고리의 제품도 함께 조회
        List<Product> products = productRepository.findByCategoryIdOrParentCategoryId(categoryId);
        System.out.println("조회된 제품 개수: " + products.size());
        List<ProductResponse> responses = products.stream()
                .map(p -> {
                    ProductResponse.CategoryInfo categoryInfo = new ProductResponse.CategoryInfo(
                            p.getCategory().getId(),
                            p.getCategory().getName(),
                            p.getCategory().getCode()
                    );
                    return new ProductResponse(
                            p.getId(),
                            p.getName(),
                            p.getBasePrice(),
                            p.getDescription(),
                            categoryInfo
                    );
                })
                .collect(Collectors.toList());
        System.out.println("반환할 제품 응답 개수: " + responses.size());
        return ResponseEntity.ok(responses);
    }

    // 5. 제품별 옵션 목록 조회 (제품별 옵션 + 카테고리 전체 공통 옵션)
    // 요청: GET http://localhost:8080/api/options?productId=1&companyId=1
    @GetMapping("/options")
    public ResponseEntity<List<OptionResponse>> getOptions(
            @RequestParam(required = false) Long productId,
            @RequestParam Long companyId) {
        System.out.println("옵션 조회 요청 - productId: " + productId + ", companyId: " + companyId);
        List<Option> options;
        if (productId != null) {
            // 제품별 옵션 조회
            try {
                System.out.println("제품별 옵션 조회 시도 - productId: " + productId);
                List<Option> productOptions = optionRepository.findByProductId(productId);
                System.out.println("제품별 옵션 조회 성공 - productId: " + productId + ", 옵션 개수: " + productOptions.size());
                
                // 제품의 카테고리 정보 가져오기 (카테고리와 부모 카테고리를 함께 조회)
                Product product = productRepository.findByIdWithCategoryAndParent(productId)
                        .orElseThrow(() -> new IllegalArgumentException("제품이 존재하지 않습니다."));
                
                // 카테고리 전체 공통 옵션 조회 (product_id가 NULL인 옵션)
                // 세부 카테고리인 경우 부모 카테고리까지 확인
                List<Option> categoryOptions = new java.util.ArrayList<>();
                
                // 현재 카테고리 ID 수집
                java.util.List<Long> categoryIds = new java.util.ArrayList<>();
                Category currentCategory = product.getCategory();
                if (currentCategory != null) {
                    categoryIds.add(currentCategory.getId());
                    
                    // 부모 카테고리 ID 수집
                    Category parentCategory = currentCategory.getParent();
                    if (parentCategory != null) {
                        categoryIds.add(parentCategory.getId());
                        // 최상위 카테고리까지 확인 (DOOR)
                        Category grandParentCategory = parentCategory.getParent();
                        if (grandParentCategory != null) {
                            categoryIds.add(grandParentCategory.getId());
                        }
                    }
                }
                
                // 모든 카테고리에서 옵션 조회
                for (Long categoryId : categoryIds) {
                    List<Option> optionsForCategory = optionRepository.findByCompanyIdAndCategoryIdAndProductIsNull(
                            companyId, categoryId);
                    categoryOptions.addAll(optionsForCategory);
                    System.out.println("카테고리 공통 옵션 조회 - categoryId: " + categoryId + 
                                     ", 옵션 개수: " + optionsForCategory.size());
                }
                
                System.out.println("전체 카테고리 공통 옵션 개수: " + categoryOptions.size());
                
                // 제품별 옵션과 카테고리 공통 옵션 합치기
                options = new java.util.ArrayList<>(productOptions);
                options.addAll(categoryOptions);
                
                // 중복 제거 (같은 이름의 옵션이 있으면 제품별 옵션 우선)
                options = options.stream()
                        .collect(java.util.stream.Collectors.toMap(
                                Option::getName,
                                opt -> opt,
                                (existing, replacement) -> existing, // 중복 시 기존 것 유지
                                java.util.LinkedHashMap::new
                        ))
                        .values()
                        .stream()
                        .sorted((a, b) -> Long.compare(a.getId(), b.getId())) // id 순서로 정렬
                        .collect(java.util.stream.Collectors.toList());
                
                System.out.println("최종 옵션 개수: " + options.size());
                options.forEach(opt -> System.out.println("  - 옵션: " + opt.getName() + ", 가격: " + opt.getAddPrice()));
            } catch (Exception e) {
                System.err.println("옵션 조회 실패: " + e.getMessage());
                e.printStackTrace();
                // 오류 발생 시 빈 리스트 반환
                options = List.of();
            }
        } else {
            // 전체 옵션 (기존 호환성 유지)
            options = optionRepository.findByCompanyId(companyId);
        }
        System.out.println("조회된 옵션 개수: " + options.size());
        
        List<OptionResponse> responses = options.stream()
                .map(opt -> {
                    OptionResponse.CategoryInfo categoryInfo = opt.getCategory() != null
                            ? new OptionResponse.CategoryInfo(
                                    opt.getCategory().getId(),
                                    opt.getCategory().getName(),
                                    opt.getCategory().getCode()
                            )
                            : null;
                    return new OptionResponse(
                            opt.getId(),
                            opt.getName(),
                            opt.getAddPrice(),
                            categoryInfo
                    );
                })
                .collect(Collectors.toList());
        System.out.println("반환할 옵션 응답 개수: " + responses.size());
        return ResponseEntity.ok(responses);
    }

    // 6. 제품별 variants 목록 조회
    // 요청: GET http://localhost:8080/api/variants?productId=1
    @GetMapping("/variants")
    public ResponseEntity<List<ProductVariantResponse>> getVariants(@RequestParam Long productId) {
        System.out.println("Variants 조회 요청 - productId: " + productId);
        List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
        System.out.println("조회된 variants 개수: " + variants.size());
        
        List<ProductVariantResponse> responses = variants.stream()
                .map(v -> new ProductVariantResponse(
                        v.getId(),
                        v.getSpecName(),
                        v.getTypeName(),
                        v.getPrice(),
                        v.getNote()
                ))
                .collect(Collectors.toList());
        System.out.println("반환할 variants 응답 개수: " + responses.size());
        return ResponseEntity.ok(responses);
    }

    // [예외 처리] 제품이 없거나 규격이 안 맞을 때 에러 메시지를 예쁘게 리턴
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body("에러 발생: " + e.getMessage());
    }
    
    // [예외 처리] 일반 예외 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralException(Exception e) {
        System.err.println("예외 발생: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(500).body("서버 오류가 발생했습니다: " + e.getMessage());
    }
}