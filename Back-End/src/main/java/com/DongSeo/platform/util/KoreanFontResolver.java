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
import java.util.List;

/**
 * PDF 한글 폰트 경로 리졸버
 *
 * EC2 등 서버에서는 반드시 파일 시스템 절대경로로 폰트를 지정해야 한글이 출력된다.
 * 브라우저 URL(/NanumGothic-normal.js) 은 사용하지 않는다.
 *
 * 우선순위:
 * 1. app.pdf.font-path 또는 환경변수 PDF_FONT_PATH 에 지정된 절대경로
 * 2. EC2/리눅스 공통 파일시스템 경로 (나눔고딕, 노토 CJK 순)
 * 3. classpath:fonts/NanumGothic.ttf → 임시 파일 (로컬 개발용)
 */
@Slf4j
@Component
public class KoreanFontResolver {

    /** EC2/Ubuntu 등에서 사용할 파일시스템 절대경로 (.ttf만 사용, .ttc는 PDFBox 로드 이슈 가능) */
    private static final List<String> FILESYSTEM_FONT_PATHS = List.of(
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        "/usr/share/fonts/opentype/nanum/NanumGothic.ttf",
        "/usr/share/fonts/truetype/nanum/NanumGothicRegular.ttf",
        "/usr/share/fonts/truetype/nanum/NanumBarunGothic.ttf"
    );

    private static final String CLASSPATH_FONT = "fonts/NanumGothic.ttf";

    @Value("${app.pdf.font-path:}")
    private String configuredFontPath;

    /**
     * PDF 생성에 사용할 한글 폰트 파일을 반환한다.
     * 항상 파일시스템 절대경로(File)를 사용한다. URL/브라우저 경로는 사용하지 않는다.
     *
     * @return 폰트 파일 (존재하고 읽기 가능한 파일)
     * @throws IOException 폰트를 찾을 수 없거나 사용할 수 없는 경우
     */
    public File getKoreanFontFile() throws IOException {
        // 1. 설정된 절대경로 (app.pdf.font-path 또는 환경변수 PDF_FONT_PATH)
        String pathToTry = (configuredFontPath != null && !configuredFontPath.isBlank())
            ? configuredFontPath.trim()
            : System.getenv("PDF_FONT_PATH");
        if (pathToTry != null && !pathToTry.isBlank()) {
            File f = new File(pathToTry);
            if (f.exists() && f.canRead()) {
                log.info("PDF 한글 폰트 사용 (명시 경로): {}", f.getAbsolutePath());
                return f;
            }
            log.warn("PDF 폰트 경로가 설정되어 있으나 파일을 찾을 수 없음: {}", pathToTry);
        }

        // 2. 파일시스템 절대경로 후보 (EC2/리눅스)
        for (String path : FILESYSTEM_FONT_PATHS) {
            File f = new File(path);
            if (f.exists() && f.canRead()) {
                log.info("PDF 한글 폰트 사용 (파일시스템): {}", f.getAbsolutePath());
                return f;
            }
        }

        // 3. classpath 리소스 → 임시 파일 (로컬 개발용만 권장)
        ClassPathResource resource = new ClassPathResource(CLASSPATH_FONT);
        if (resource.exists()) {
            File temp = File.createTempFile("NanumGothic", ".ttf");
            temp.deleteOnExit();
            try (InputStream in = resource.getInputStream()) {
                Files.copy(in, temp.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
            log.warn("PDF 한글 폰트: 파일시스템 경로 없음 → classpath 임시파일 사용. 서버에서는 PDF_FONT_PATH 또는 fonts-nanum 설치 권장. 경로={}", temp.getAbsolutePath());
            return temp;
        }

        throw new IOException(
            "PDF 한글 폰트를 찾을 수 없습니다. "
            + "서버(EC2): sudo apt install -y fonts-nanum && sudo reboot 후 "
            + "ls /usr/share/fonts/truetype/nanum/ 로 경로 확인하고, 필요 시 export PDF_FONT_PATH=/usr/share/fonts/truetype/nanum/NanumGothic.ttf 설정. "
            + "로컬: src/main/resources/fonts/NanumGothic.ttf 추가."
        );
    }
}
