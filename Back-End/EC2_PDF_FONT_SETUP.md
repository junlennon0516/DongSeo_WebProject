# EC2 PDF 한글 폰트 설정 가이드

**원인**: PDFBox/jsPDF는 OS에 설치된 폰트를 자동으로 찾지 못하는 경우가 많습니다.  
**증상**: 로컬에서는 PDF 한글이 정상인데, EC2에서만 `ÂP²`, `Ç'Á1Ç|` 같은 깨짐.  
**해결**: OS 폰트 설치에 의존하지 않고, **프로젝트 내부에 폰트 파일을 포함**하여 사용합니다.

---

## ✅ 권장 방법: 프로젝트 내부 폰트 사용 (EC2 환경과 무관)

**Back-End (PDFBox)**: `src/main/resources/fonts/NanumGothic.ttf`에 폰트 파일을 넣으면 자동으로 사용됩니다.  
**Front-End (jsPDF)**: `src/assets/fonts/nanumGothicBase64.ts`에 Base64 문자열을 추가하면 됩니다.

이 방법은 EC2에 폰트를 설치할 필요가 없으며, 모든 환경에서 동일하게 동작합니다.

### JAR 배포(EC2) 시 체크리스트

**"로컬에서는 되는데 EC2에서만 안 된다"**면 아래를 순서대로 확인하세요.

1. **`getFile()` / `getPath()` 사용 금지**  
   JAR 안에는 파일 경로가 없고 스트림만 있으므로, `ClassPathResource`는 **반드시 `getInputStream()`**으로만 읽습니다.  
   `EstimatePdfService.loadFont()`는 이미 `getInputStream()`만 사용합니다.

2. **빌드된 JAR 안에 폰트 포함 여부 확인**  
   EC2에서:
   ```bash
   jar tf BackEnd-0.0.1-SNAPSHOT.jar | grep Nanum
   ```
   `BOOT-INF/classes/fonts/NanumGothic.ttf` (또는 유사 경로)가 나와야 합니다. 없으면 `src/main/resources/fonts/` 위치와 빌드 설정을 확인하세요.

3. **리소스 경로**  
   `ClassPathResource("fonts/NanumGothic.ttf")` 처럼 **맨 앞 슬래시 없이** 사용합니다.

---

## (구) EC2에 한글 폰트 설치 방법 (참고용)

> ⚠️ 이 방법은 더 이상 권장되지 않습니다. 위의 프로젝트 내부 폰트 사용 방법을 사용하세요.

```bash
sudo apt update
sudo apt install -y fonts-nanum fonts-noto-cjk
```

확인:

```bash
fc-list | grep Nanum
```

하나라도 나오면 성공.

---

## 2. 서버 재부팅 (필수)

폰트 캐시 반영을 위해 **재부팅**이 필요합니다.

```bash
sudo reboot
```

---

## 3. 폰트 경로 확인

```bash
ls /usr/share/fonts/truetype/nanum/
```

보통 `NanumGothic.ttf`, `NanumGothicBold.ttf` 등이 있습니다.

---

## 4. 환경 변수로 폰트 명시 (권장)

**한글이 여전히 안 나올 때** — 코드에서 파일시스템 경로를 명시적으로 쓰도록 환경 변수를 설정하세요.

- 브라우저 URL (`/NanumGothic-normal.js`) ❌ 사용하지 않음  
- 파일 시스템 경로 (`/usr/share/fonts/...`) ⭕ 사용

```bash
export PDF_FONT_PATH=/usr/share/fonts/truetype/nanum/NanumGothic.ttf
```

systemd 사용 시:

```ini
[Service]
Environment="PDF_FONT_PATH=/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
```

설정 후 백엔드 재시작. 로그에 `PDF 한글 폰트 사용 (명시 경로): /usr/share/fonts/...` 가 나오면 적용된 것입니다.

---

## 5. 백엔드 재시작

```bash
sudo systemctl restart backend   # 또는 사용 중인 서비스명
```

---

## 체크리스트

- [ ] EC2에 `fonts-nanum` 설치
- [ ] `fc-list | grep Nanum` 로 폰트 확인
- [ ] **서버 재부팅**
- [ ] `PDF_FONT_PATH` 미설정 시 기본 경로 사용 (코드에서 절대경로 지정)
- [ ] `systemctl restart` 로 백엔드 재시작

---

## 코드 요약

### Back-End (PDFBox)
- **폰트 위치**: `src/main/resources/fonts/NanumGothic.ttf`
- **PDF 생성**: `EstimatePdfService.loadFont()` — `ClassPathResource.getInputStream()`으로만 읽고 `PDType0Font.load(document, is)` 호출 (JAR 배포 시 `getFile()` 사용 금지)
- **장점**: OS 환경(EC2 폰트 설치 여부)과 무관하게 동작
- **API**: `POST /api/estimates/export-pdf` — 견적서 JSON 받아 서버에서 PDF 생성 후 다운로드

### Front-End (jsPDF)
- **폰트 위치**: `src/assets/fonts/nanumGothicBase64.ts`
- **사용 방법**: `NanumGothic.ttf` 파일을 Base64로 변환하여 `NANUM_GOTHIC_BASE64` 상수에 추가
- **장점**: 서버 환경과 무관하게 브라우저에서 직접 폰트 사용

**이제 EC2에 폰트를 설치할 필요가 없습니다!** 프로젝트에 폰트 파일만 포함하면 됩니다.
