package com.DongSeo.platform.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * 정적 리소스 제공 컨트롤러 (디버깅용)
 * Spring Boot의 기본 정적 리소스 핸들러가 작동하지 않을 때 사용
 */
@Slf4j
@RestController
public class StaticResourceController {

    @GetMapping("/NanumGothic-normal.js")
    public ResponseEntity<Resource> getNanumGothicFont() {
        try {
            ClassPathResource resource = new ClassPathResource("static/NanumGothic-normal.js");
            
            if (!resource.exists()) {
                log.error("NanumGothic-normal.js 파일을 찾을 수 없습니다. 경로: static/NanumGothic-normal.js");
                return ResponseEntity.notFound().build();
            }
            
            log.info("NanumGothic-normal.js 파일 제공: {} bytes", resource.contentLength());
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "application/javascript; charset=UTF-8")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"NanumGothic-normal.js\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .body(resource);
                    
        } catch (IOException e) {
            log.error("NanumGothic-normal.js 파일 읽기 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
