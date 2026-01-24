package com.DongSeo.platform.jwt;

import com.DongSeo.platform.domain.User;
import com.DongSeo.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${jwt.expiration-ms:86400000}")
    private long expirationMs; // 기본 24시간

    /**
     * 로그인: username/password 검증 후 JWT 발급.
     * 계정은 관리자가 생성·부여 (회원가입 없음).
     */
    public String login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음 또는 비밀번호 오류"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("사용자 없음 또는 비밀번호 오류");
        }

        return jwtUtil.createToken(user.getUsername(), user.getRole(), expirationMs);
    }
}
