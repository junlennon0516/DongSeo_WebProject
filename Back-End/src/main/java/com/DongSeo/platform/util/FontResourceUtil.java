package com.DongSeo.platform.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

/**
 * JAR 내부 리소스 파일을 읽는 유틸리티 클래스
 * 
 * ⚠️ 중요: JAR로 패키징되면 File("src/main/resources/...") 방식은 작동하지 않습니다.
 * ClassPathResource를 사용하여 JAR 내부의 리소스를 읽어야 합니다.
 */
@Slf4j
@Component
public class FontResourceUtil {

    /**
     * ClassPathResource로 리소스 파일의 InputStream을 반환
     * 
     * @param resourcePath resources 폴더 기준 경로 (예: "fonts/NanumGothic.ttf", "NanumGothic-normal.js")
     * @return InputStream (사용 후 close 필요)
     * @throws IOException 리소스를 찾을 수 없거나 읽을 수 없는 경우
     */
    public InputStream getResourceInputStream(String resourcePath) throws IOException {
        ClassPathResource resource = new ClassPathResource(resourcePath);
        if (!resource.exists()) {
            throw new IOException("리소스를 찾을 수 없습니다: " + resourcePath);
        }
        log.debug("리소스 로드 성공: {}", resourcePath);
        return resource.getInputStream();
    }

    /**
     * 리소스 파일을 임시 파일로 복사하여 실제 파일 경로 반환
     * 
     * 라이브러리가 꼭 File 경로(String)를 요구할 때 사용
     * 
     * @param resourcePath resources 폴더 기준 경로
     * @param tempFilePrefix 임시 파일 이름 prefix
     * @param tempFileSuffix 임시 파일 확장자 (예: ".ttf", ".js")
     * @return 임시 파일의 절대 경로
     * @throws IOException 리소스를 찾을 수 없거나 복사 실패
     */
    public String getResourceAsTempFile(String resourcePath, String tempFilePrefix, String tempFileSuffix) throws IOException {
        // 1. 리소스 가져오기
        ClassPathResource resource = new ClassPathResource(resourcePath);
        if (!resource.exists()) {
            throw new IOException("리소스를 찾을 수 없습니다: " + resourcePath);
        }

        // 2. 서버의 임시 파일 생성
        File tempFile = File.createTempFile(tempFilePrefix, tempFileSuffix);
        
        // 3. JAR 안의 내용을 임시 파일로 복사
        try (InputStream inputStream = resource.getInputStream()) {
            Files.copy(inputStream, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
        
        log.debug("리소스를 임시 파일로 복사 완료: {} -> {}", resourcePath, tempFile.getAbsolutePath());
        
        // 4. 복사된 실제 파일 경로 반환 (이제 라이브러리가 읽을 수 있음)
        return tempFile.getAbsolutePath();
    }

    /**
     * NanumGothic-normal.js 파일의 InputStream 반환
     * 
     * @return InputStream
     * @throws IOException 파일을 찾을 수 없는 경우
     */
    public InputStream getNanumGothicFontJs() throws IOException {
        return getResourceInputStream("static/NanumGothic-normal.js");
    }

    /**
     * NanumGothic-normal.js 파일을 임시 파일로 복사하여 경로 반환
     * 
     * @return 임시 파일의 절대 경로
     * @throws IOException 파일을 찾을 수 없거나 복사 실패
     */
    public String getNanumGothicFontJsPath() throws IOException {
        return getResourceAsTempFile("static/NanumGothic-normal.js", "NanumGothic", ".js");
    }
}
