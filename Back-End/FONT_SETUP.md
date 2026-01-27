# NanumGothic 폰트 파일 설정 가이드

## 📋 개요

백엔드 서버에서 `NanumGothic-normal.js` 파일을 정적 리소스로 제공하여, 프론트엔드에서 PDF 생성 시 한글 폰트를 사용할 수 있도록 합니다.

## 🔧 설정 방법

### 1단계: 폰트 파일 복사

프론트엔드의 `NanumGothic-normal.js` 파일을 백엔드 `resources/static` 폴더로 복사합니다:

```bash
# Windows (PowerShell)
Copy-Item "Front-End\public\NanumGothic-normal.js" "Back-End\src\main\resources\static\NanumGothic-normal.js"

# 또는 수동으로
# Front-End/public/NanumGothic-normal.js 
# → Back-End/src/main/resources/static/NanumGothic-normal.js
```

**폴더 구조:**
```
Back-End/
  src/
    main/
      resources/
        static/
          NanumGothic-normal.js  ← 여기에 복사
```

### 2단계: SecurityConfig 확인

`SecurityConfig.java`에서 이미 `/NanumGothic-normal.js` 경로가 `permitAll()`에 추가되어 있습니다:

```java
.requestMatchers("/NanumGothic-normal.js").permitAll() // 폰트 파일 정적 리소스 허용
```

### 3단계: 정적 리소스 제공 확인

Spring Boot는 기본적으로 `src/main/resources/static` 폴더의 파일을 루트 경로(`/`)로 제공합니다.

- 로컬: `http://localhost:8080/NanumGothic-normal.js`
- 배포: `https://your-backend-domain.com/NanumGothic-normal.js`

## 📝 사용 방법

### 프론트엔드에서 사용

프론트엔드 코드에서 백엔드 서버의 폰트 파일을 사용:

```typescript
// api.ts의 API_BASE_URL을 사용하여 백엔드 서버 URL 구성
const fontUrl = `${API_BASE_URL.replace('/api', '')}/NanumGothic-normal.js`;
// 또는 직접 백엔드 URL 사용
const fontUrl = 'http://localhost:8080/NanumGothic-normal.js';

const fontResponse = await fetch(fontUrl);
```

### 백엔드에서 사용 (PDF 생성 등)

`FontResourceUtil` 클래스를 사용하여 JAR 내부의 리소스를 읽을 수 있습니다:

```java
@Autowired
private FontResourceUtil fontResourceUtil;

// 방법 1: InputStream으로 읽기
InputStream fontStream = fontResourceUtil.getNanumGothicFontJs();

// 방법 2: 임시 파일로 복사하여 경로 얻기 (라이브러리가 File 경로를 요구할 때)
String fontPath = fontResourceUtil.getNanumGothicFontJsPath();
```

## ⚠️ 주의사항

1. **JAR 패키징 시**: `File("src/main/resources/...")` 방식은 **절대 작동하지 않습니다**
   - ✅ `ClassPathResource` 사용 (FontResourceUtil에서 제공)
   - ✅ `InputStream` 사용
   - ❌ `new File("src/main/resources/...")` 사용 금지

2. **파일 크기**: `NanumGothic-normal.js` 파일이 약 6MB이므로 Git에 커밋할지 고려
   - `.gitignore`에 추가하거나
   - 빌드 시 자동 복사하도록 설정

3. **배포 시**: EC2 서버에 배포할 때 `static` 폴더의 파일이 JAR에 포함되는지 확인

## ✅ 확인 방법

1. 서버 실행 후 브라우저에서 접근:
   ```
   http://localhost:8080/NanumGothic-normal.js
   ```
   → 파일 내용이 보이면 성공

2. 프론트엔드에서 fetch 테스트:
   ```javascript
   fetch('http://localhost:8080/NanumGothic-normal.js')
     .then(res => res.text())
     .then(text => console.log('폰트 파일 로드 성공:', text.substring(0, 100)));
   ```
