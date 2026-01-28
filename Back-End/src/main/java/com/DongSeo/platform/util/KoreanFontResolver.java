package com.DongSeo.platform.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

/**
 * PDF 한글 폰트 경로 리졸버
 *
 * EC2 등 서버에는 한글 폰트가 없으므로 반드시 절대경로로 폰트를 지정해야 한다.
 * systemd 환경에서는 OS 폰트 자동 탐색이 되지 않는다.
 *
 * 우선순위:
 * 1. PDF_FONT_PATH (또는 app.pdf.font-path) 에 지정된 절대경로
 * 2. EC2 기본 경로: /usr/share/fonts/truetype/nanum/NanumGothic.ttf (fonts-nanum 설치 후)
 * 3. classpath:fonts/NanumGothic.ttf → 임시 파일로 복사 (로컬 개발용)
 */
@Slf4j
@Component
public class KoreanFontResolver {

    private static final String EC2_NANUM_PATH = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf";
    private static final String CLASSPATH_FONT = "fonts/NanumGothic.ttf";

    @Value("${app.pdf.font-path:}")
    private String configuredFontPath;

    /**
     * PDF 생성에 사용할 한글 폰트 파일을 반환한다.
     * 절대경로로 지정된 File 이어야 PDFBox 등에서 서버에서 정상 동작한다.
     *
     * @return 폰트 파일 (존재하고 읽기 가능한 파일)
     * @throws IOException 폰트를 찾을 수 없거나 사용할 수 없는 경우
     */
    public File getKoreanFontFile() throws IOException {
        // 1. 설정된 절대경로
        if (configuredFontPath != null && !configuredFontPath.isBlank()) {
            File f = new File(configuredFontPath.trim());
            if (f.exists() && f.canRead()) {
                log.info("PDF 한글 폰트 사용 (설정): {}", f.getAbsolutePath());
                return f;
            }
            log.warn("PDF 폰트 경로가 설정되어 있으나 파일을 찾을 수 없음: {}", configuredFontPath);
        }

        // 2. EC2 기본 경로 (fonts-nanum 설치 후)
        File ec2Font = new File(EC2_NANUM_PATH);
        if (ec2Font.exists() && ec2Font.canRead()) {
            log.info("PDF 한글 폰트 사용 (EC2 기본): {}", EC2_NANUM_PATH);
            return ec2Font;
        }

        // 3. classpath 리소스 → 임시 파일 (로컬 개발)
        ClassPathResource resource = new ClassPathResource(CLASSPATH_FONT);
        if (resource.exists()) {
            File temp = File.createTempFile("NanumGothic", ".ttf");
            try (InputStream in = resource.getInputStream()) {
                Files.copy(in, temp.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("PDF 한글 폰트 사용 (classpath → 임시파일): {}", temp.getAbsolutePath());
            return temp;
        }

        throw new IOException(
            "PDF 한글 폰트를 찾을 수 없습니다. " +
            "EC2: sudo apt install -y fonts-nanum && sudo reboot 후 " +
            "경로 확인: ls /usr/share/fonts/truetype/nanum/ " +
            "로컬: src/main/resources/fonts/NanumGothic.ttf 추가 또는 PDF_FONT_PATH 로 절대경로 지정."
        );
    }
}
