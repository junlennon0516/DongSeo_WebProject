package com.DongSeo.platform.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 0. 인증이 필요없는 경로는 바로 통과
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/") || path.startsWith("/ai-api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 1. 헤더에서 토큰 추출
        String authorizationHeader = request.getHeader("Authorization");

        // 2. 토큰이 없거나 Bearer로 시작하지 않으면 패스
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String[] parts = authorizationHeader.split(" ");
        if (parts.length < 2 || parts[1].isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = parts[1];

        // 3. 토큰 유효성 검증
        if (!jwtUtil.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 4. 유효하다면 SecurityContext에 인증 정보 저장
        String username = jwtUtil.getUsername(token);
        String role = jwtUtil.getRole(token);
        // hasRole()은 ROLE_ 접두사 사용
        String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(roleWithPrefix);

        // 인증 객체 생성 (비밀번호는 null로 처리)
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(username, null, List.of(authority));

        SecurityContextHolder.getContext().setAuthentication(authenticationToken);

        filterChain.doFilter(request, response);
    }
}
