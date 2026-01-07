package com.DongSeo.platform.controller;

import com.DongSeo.platform.domain.Category;
import com.DongSeo.platform.domain.Option;
import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.dto.*;
import com.DongSeo.platform.repository.CategoryRepository;
import com.DongSeo.platform.repository.OptionRepository;
import com.DongSeo.platform.repository.ProductRepository;
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

    // 3. 카테고리 목록 조회
    // 요청: GET http://localhost:8080/api/categories?companyId=1
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories(@RequestParam(required = false) Long companyId) {
        List<Category> categories;
        if (companyId != null) {
            categories = categoryRepository.findByCompanyId(companyId);
        } else {
            // companyId가 없으면 모든 카테고리 조회 (디버깅용)
            categories = categoryRepository.findAll();
        }
        List<CategoryResponse> responses = categories.stream()
                .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getCode()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    // 4. 카테고리별 제품 목록 조회
    // 요청: GET http://localhost:8080/api/products?categoryId=1
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getProducts(@RequestParam Long categoryId) {
        List<Product> products = productRepository.findByCategoryId(categoryId);
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
        return ResponseEntity.ok(responses);
    }

    // 5. 카테고리별 옵션 목록 조회
    // 요청: GET http://localhost:8080/api/options?categoryId=1&companyId=1
    @GetMapping("/options")
    public ResponseEntity<List<OptionResponse>> getOptions(
            @RequestParam(required = false) Long categoryId,
            @RequestParam Long companyId) {
        List<Option> options;
        if (categoryId != null) {
            // 특정 카테고리의 옵션 + 전체 공통 옵션
            options = optionRepository.findByCompanyId(companyId).stream()
                    .filter(opt -> opt.getCategory() == null || 
                            (opt.getCategory() != null && opt.getCategory().getId().equals(categoryId)))
                    .toList();
        } else {
            // 전체 옵션
            options = optionRepository.findByCompanyId(companyId);
        }
        
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
        return ResponseEntity.ok(responses);
    }

    // [예외 처리] 제품이 없거나 규격이 안 맞을 때 에러 메시지를 예쁘게 리턴
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body("에러 발생: " + e.getMessage());
    }
}