package com.DongSeo.platform.jwt;

import com.DongSeo.platform.domain.User;
import com.DongSeo.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 최초 기동 시 사용자가 없으면 기본 관리자(admin / admin123) 생성.
 * 관리자가 계정 생성·부여하는 방식이므로, 이후 계정은 DB/관리 기능으로 추가.
 */
@Component
@RequiredArgsConstructor
public class InitialAdminRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        // 사용자가 한 명도 없을 때만 admin 생성
        if (userRepository.count() == 0) {
            User admin = new User(
                    "admin",
                    passwordEncoder.encode("admin123"),
                    "ADMIN"
            );
            userRepository.save(admin);
        }

        // ds2200 계정이 없으면 생성 (이미 admin만 있는 DB에서도 로그인 가능하도록)
        if (userRepository.findByUsername("ds2200").isEmpty()) {
            User staff = new User(
                    "ds2200",
                    passwordEncoder.encode("3132200!"),
                    "STAFF"
            );
            userRepository.save(staff);
        }
    }
}
