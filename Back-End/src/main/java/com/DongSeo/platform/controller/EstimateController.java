package com.DongSeo.platform.controller;

import com.DongSeo.platform.domain.Category;
import com.DongSeo.platform.domain.Color;
import com.DongSeo.platform.domain.Option;
import com.DongSeo.platform.domain.Product;
import com.DongSeo.platform.domain.ProductVariant;
import com.DongSeo.platform.dto.*;
import com.DongSeo.platform.repository.CategoryRepository;
import com.DongSeo.platform.repository.ColorRepository;
import com.DongSeo.platform.repository.OptionRepository;
import com.DongSeo.platform.repository.ProductRepository;
import com.DongSeo.platform.repository.ProductVariantRepository;
import com.DongSeo.platform.service.EstimationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 견적 관련 REST API 컨트롤러
 * 카테고리, 제품, 옵션, 색상 등의 조회 및 견적 계산을 제공합니다.
 */
@Slf4j
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
    private final ColorRepository colorRepository;

    /**
     * 견적 계산 API
     * 제품, 옵션, 수량 등을 기반으로 견적을 계산합니다.
     * 
     * @param request 견적 요청 정보 (제품 ID, 옵션 ID 목록, 수량 등)
     * @return 계산된 견적 결과
     */
    @PostMapping("/estimates/calculate")
    public ResponseEntity<EstimateResponse> calculateEstimate(@RequestBody EstimateRequest request) {
        log.debug("견적 계산 요청: productId={}, quantity={}", request.getProductId(), request.getQuantity());
        try {
            EstimateResponse response = estimateService.calculate(request);
            log.info("견적 계산 완료: productId={}, totalPrice={}", request.getProductId(), response.getTotalPrice());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("견적 계산 실패: productId={}", request.getProductId(), e);
            throw e;
        }
    }

    /**
     * 서버 상태 확인 API (Health Check)
     * 
     * @return 서버 상태 메시지
     */
    @GetMapping("/estimates/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Chenu Estimate System is Running!");
    }

    /**
     * 메인 카테고리 목록 조회
     * parent가 null인 최상위 카테고리만 반환합니다.
     * 
     * @param companyId 회사 ID (선택사항, 없으면 모든 메인 카테고리 조회)
     * @return 메인 카테고리 목록
     */
    @GetMapping("/categories")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CategoryResponse>> getCategories(@RequestParam(required = false) Long companyId) {
        log.debug("메인 카테고리 조회 요청: companyId={}", companyId);
        try {
            List<Category> categories = (companyId != null)
                    ? categoryRepository.findMainCategoriesByCompanyId(companyId)
                    : categoryRepository.findAll().stream()
                            .filter(c -> c.getParent() == null)
                            .collect(Collectors.toList());
            
            List<CategoryResponse> responses = categories.stream()
                    .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getCode()))
                    .collect(Collectors.toList());
            
            log.info("메인 카테고리 조회 완료: companyId={}, count={}", companyId, responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("카테고리 조회 실패: companyId={}", companyId, e);
            throw e;
        }
    }
    
    /**
     * 세부 카테고리 목록 조회
     * 특정 부모 카테고리의 하위 카테고리들을 반환합니다.
     * 
     * @param parentId 부모 카테고리 ID
     * @return 세부 카테고리 목록
     */
    @GetMapping("/subcategories")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CategoryResponse>> getSubCategories(@RequestParam Long parentId) {
        log.debug("세부 카테고리 조회 요청: parentId={}", parentId);
        try {
            List<Category> subCategories = categoryRepository.findByParentId(parentId);
            List<CategoryResponse> responses = subCategories.stream()
                    .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getCode()))
                    .collect(Collectors.toList());
            
            log.info("세부 카테고리 조회 완료: parentId={}, count={}", parentId, responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("세부 카테고리 조회 실패: parentId={}", parentId, e);
            throw e;
        }
    }

    /**
     * 카테고리별 제품 목록 조회
     * 메인 카테고리인 경우 하위 세부 카테고리의 제품도 함께 조회합니다.
     * 
     * @param categoryId 카테고리 ID
     * @return 제품 목록
     */
    @GetMapping("/products")
    @Transactional(readOnly = true)
    public ResponseEntity<List<ProductResponse>> getProducts(@RequestParam Long categoryId) {
        log.debug("제품 조회 요청: categoryId={}", categoryId);
        try {
            List<Product> products = productRepository.findByCategoryIdOrParentCategoryId(categoryId);
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
            
            log.info("제품 조회 완료: categoryId={}, count={}", categoryId, responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("제품 조회 실패: categoryId={}", categoryId, e);
            throw e;
        }
    }

    /**
     * 옵션 목록 조회
     * 제품별 옵션과 카테고리 공통 옵션을 합쳐서 반환합니다.
     * 제품별 옵션이 있으면 우선 적용됩니다.
     * 
     * @param productId 제품 ID (선택사항)
     * @param companyId 회사 ID
     * @return 옵션 목록
     */
    @GetMapping("/options")
    @Transactional(readOnly = true)
    public ResponseEntity<List<OptionResponse>> getOptions(
            @RequestParam(required = false) Long productId,
            @RequestParam Long companyId) {
        log.debug("옵션 조회 요청: productId={}, companyId={}", productId, companyId);
        try {
            List<Option> options;
            
            if (productId != null) {
                options = getOptionsForProduct(productId, companyId);
            } else {
                // 전체 옵션 조회 (기존 호환성 유지)
                options = optionRepository.findByCompanyId(companyId);
            }
            
            List<OptionResponse> responses = options.stream()
                    .map(this::mapToOptionResponse)
                    .collect(Collectors.toList());
            
            log.info("옵션 조회 완료: productId={}, companyId={}, count={}", productId, companyId, responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("옵션 조회 실패: productId={}, companyId={}", productId, companyId, e);
            throw e;
        }
    }
    
    /**
     * 제품별 옵션 조회 (제품별 옵션 + 카테고리 공통 옵션)
     */
    private List<Option> getOptionsForProduct(Long productId, Long companyId) {
        log.debug("제품별 옵션 조회: productId={}", productId);
        
        // 제품별 옵션 조회
        List<Option> productOptions = optionRepository.findByProductId(productId);
        log.debug("제품별 옵션 조회 완료: productId={}, count={}", productId, productOptions.size());
        
        // 제품의 카테고리 정보 가져오기
        Product product = productRepository.findByIdWithCategoryAndParent(productId)
                .orElseThrow(() -> new IllegalArgumentException("제품이 존재하지 않습니다."));
        
        // 카테고리 계층 구조에서 옵션 조회
        List<Option> categoryOptions = getCategoryOptions(product, companyId);
        
        // 제품별 옵션과 카테고리 공통 옵션 합치기
        List<Option> allOptions = new java.util.ArrayList<>(productOptions);
        allOptions.addAll(categoryOptions);
        
        // 중복 제거 (같은 이름의 옵션이 있으면 제품별 옵션 우선)
        return allOptions.stream()
                .collect(java.util.stream.Collectors.toMap(
                        Option::getName,
                        opt -> opt,
                        (existing, replacement) -> existing,
                        java.util.LinkedHashMap::new
                ))
                .values()
                .stream()
                .sorted((a, b) -> Long.compare(a.getId(), b.getId()))
                .collect(java.util.stream.Collectors.toList());
    }
    
    /**
     * 카테고리 계층 구조에서 공통 옵션 조회
     */
    private List<Option> getCategoryOptions(Product product, Long companyId) {
        List<Option> categoryOptions = new java.util.ArrayList<>();
        List<Long> categoryIds = collectCategoryIds(product.getCategory());
        
        for (Long categoryId : categoryIds) {
            List<Option> optionsForCategory = optionRepository
                    .findByCompanyIdAndCategoryIdAndProductIsNull(companyId, categoryId);
            categoryOptions.addAll(optionsForCategory);
            log.debug("카테고리 공통 옵션 조회: categoryId={}, count={}", categoryId, optionsForCategory.size());
        }
        
        return categoryOptions;
    }
    
    /**
     * 카테고리 계층 구조에서 모든 카테고리 ID 수집
     * Category의 parent가 Lazy Loading이므로 세션이 유지되어야 합니다.
     */
    private List<Long> collectCategoryIds(Category category) {
        List<Long> categoryIds = new java.util.ArrayList<>();
        Category current = category;
        
        while (current != null) {
            categoryIds.add(current.getId());
            // parent가 프록시인 경우 초기화를 위해 getId()를 먼저 호출
            Category parent = current.getParent();
            if (parent != null) {
                // 프록시 초기화를 위해 getId() 호출
                parent.getId();
            }
            current = parent;
        }
        
        return categoryIds;
    }
    
    /**
     * Option 엔티티를 OptionResponse DTO로 변환
     * Category가 Lazy Loading이므로 세션이 유지되어야 합니다.
     */
    private OptionResponse mapToOptionResponse(Option opt) {
        OptionResponse.CategoryInfo categoryInfo = null;
        Category category = opt.getCategory();
        if (category != null) {
            // 프록시 초기화를 위해 getId() 먼저 호출
            category.getId();
            categoryInfo = new OptionResponse.CategoryInfo(
                    category.getId(),
                    category.getName(),
                    category.getCode()
            );
        }
        return new OptionResponse(
                opt.getId(),
                opt.getName(),
                opt.getAddPrice(),
                categoryInfo
        );
    }

    /**
     * 제품별 variants 목록 조회
     * 제품의 규격(spec)과 타입(type) 정보를 반환합니다.
     * 
     * @param productId 제품 ID
     * @return 제품 variants 목록
     */
    @GetMapping("/variants")
    @Transactional(readOnly = true)
    public ResponseEntity<List<ProductVariantResponse>> getVariants(@RequestParam Long productId) {
        log.debug("Variants 조회 요청: productId={}", productId);
        try {
            List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
            List<ProductVariantResponse> responses = variants.stream()
                    .map(v -> new ProductVariantResponse(
                            v.getId(),
                            v.getSpecName(),
                            v.getTypeName(),
                            v.getPrice(),
                            v.getNote()
                    ))
                    .collect(Collectors.toList());
            
            log.info("Variants 조회 완료: productId={}, count={}", productId, responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Variants 조회 실패: productId={}", productId, e);
            throw e;
        }
    }

    /**
     * 회사별 색상 목록 조회
     * 
     * @param companyId 회사 ID
     * @return 색상 목록
     */
    @GetMapping("/colors")
    @Transactional(readOnly = true)
    public ResponseEntity<List<ColorResponse>> getColors(@RequestParam Long companyId) {
        log.debug("색상 조회 요청: companyId={}", companyId);
        try {
            List<Color> colors = colorRepository.findByCompanyId(companyId);
            List<ColorResponse> responses = colors.stream()
                    .map(c -> {
                        ColorResponse.CompanyInfo companyInfo = new ColorResponse.CompanyInfo(
                                c.getCompany().getId(),
                                c.getCompany().getName(),
                                c.getCompany().getCode()
                        );
                        return new ColorResponse(
                                c.getId(),
                                c.getName(),
                                c.getColorCode(),
                                c.getCost(),
                                companyInfo
                        );
                    })
                    .collect(Collectors.toList());
            
            log.info("색상 조회 완료: companyId={}, count={}", companyId, responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("색상 조회 실패: companyId={}", companyId, e);
            throw e;
        }
    }

    /**
     * IllegalArgumentException 예외 처리
     * 잘못된 요청 파라미터나 비즈니스 규칙 위반 시 호출됩니다.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("잘못된 요청: {}", e.getMessage());
        return ResponseEntity.badRequest().body("에러 발생: " + e.getMessage());
    }
    
    /**
     * 일반 예외 처리
     * 예상치 못한 서버 오류 발생 시 호출됩니다.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        log.error("서버 오류 발생", e);
        return ResponseEntity.status(500).body("서버 오류가 발생했습니다: " + e.getMessage());
    }
}