# EC2 PDF 한글 폰트 설정 가이드

**원인**: EC2(Ubuntu)에는 한글 폰트가 기본 설치되어 있지 않습니다.  
**증상**: 로컬에서는 PDF 한글이 정상인데, EC2에서만 `ÂP²`, `Ç'Á1Ç|` 같은 깨짐.  
**결론**: 인코딩(UTF-8) 문제가 아니라 **폰트 부재** 문제입니다. UTF-8만으로는 해결되지 않습니다.

---

## 1. EC2에 한글 폰트 설치 (필수)

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

## 4. 환경 변수 (선택)

기본값은 `/usr/share/fonts/truetype/nanum/NanumGothic.ttf` 입니다.  
다른 경로를 쓰려면:

```bash
export PDF_FONT_PATH=/usr/share/fonts/truetype/nanum/NanumGothic.ttf
```

systemd 사용 시:

```ini
[Service]
Environment="PDF_FONT_PATH=/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
```

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

- **폰트 리졸버**: `KoreanFontResolver` — `PDF_FONT_PATH` → EC2 기본 경로 → classpath `fonts/NanumGothic.ttf` 순으로 탐색
- **PDF 생성**: `EstimatePdfService` — PDFBox `PDType0Font.load(doc, fontFile)` 로 **절대경로** 폰트 로드 후 embed
- **API**: `POST /api/estimates/export-pdf` — 견적서 JSON 받아 서버에서 PDF 생성 후 다운로드

**로컬 됐는데 서버 안 되면 99% 폰트 문제**라고 보면 됩니다.
