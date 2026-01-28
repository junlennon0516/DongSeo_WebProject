# 한글 폰트 (로컬 개발용)

PDF 서버 생성 시 한글 폰트가 필요합니다.

- **EC2**: `fonts-nanum` 설치 후 `/usr/share/fonts/truetype/nanum/NanumGothic.ttf` 사용 (재부팅 필수)
- **로컬**: 이 폴더에 `NanumGothic.ttf`를 넣어 두면 classpath 리소스로 사용됩니다.

## NanumGothic.ttf 받는 곳

- [네이버 나눔폰트](https://hangeul.naver.com/2017/nanum) → 나눔고딕
- 또는 `fonts-nanum` 패키지 설치 후 `/usr/share/fonts/truetype/nanum/` 에서 복사

이 폴더에 `NanumGothic.ttf`를 추가한 뒤 빌드하면 됩니다.
