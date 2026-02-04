package com.DongSeo.platform.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    
    @Value("${cors.allowed-origins:}")
    private String allowedOrigins;


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // jwt 쓰므로 CSRF 꺼도 됨
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 정적 리소스 먼저 허용 (순서 중요!)
                        .requestMatchers("/NanumGothic-normal.js", "/static/**", "/**/*.js", "/**/*.css", "/**/*.png", "/**/*.jpg", "/**/*.svg", "/**/*.ico", "/**/*.woff", "/**/*.ttf").permitAll()
                        // API 엔드포인트
                        .requestMatchers("/api/auth/**", "/error").permitAll()
                        .requestMatchers("/api/estimates/**", "/api/products/**", "/api/categories/**", "/api/subcategories/**", "/api/options/**", "/api/variants/**", "/api/colors/**").permitAll()
                        .requestMatchers("/ai-api/**").permitAll()  // AI 서버 프록시 경로 (인증 없이 통과)
                        .requestMatchers(HttpMethod.GET, "/api/admin/companies").permitAll()  // 제품 추가 폼 회사 목록 (드롭다운용)
                        .requestMatchers("/api/admin/**").hasAnyRole("STAFF", "ADMIN")
                        // 나머지는 인증 필요
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new JwtFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    // 비밀번호 암호화 빈
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 환경 변수에 도메인이 있으면 사용, 없으면 모든 도메인 허용
        if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
            // 쉼표로 구분된 도메인 목록 파싱
            String[] origins = allowedOrigins.split(",");
            for (String origin : origins) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    // Vercel 도메인 패턴 지원: *.vercel.app
                    if (trimmed.contains("*")) {
                        configuration.addAllowedOriginPattern(trimmed);
                    } else {
                        configuration.addAllowedOrigin(trimmed);
                    }
                }
            }
        } else {
            // 환경 변수가 없으면 모든 도메인 허용 (개발/프로덕션 모두)
            // Vercel 프리뷰 도메인이 매번 바뀌어도 자동 허용됨
            configuration.addAllowedOriginPattern("*");
        }
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        // 주의: addAllowedOriginPattern("*")와 setAllowCredentials(true)는 함께 사용 불가
        // JWT는 Authorization 헤더에 있으므로 credentials 불필요
        configuration.setAllowCredentials(false);
        configuration.setExposedHeaders(Arrays.asList("Authorization")); // 헤더 노출 허용

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}


