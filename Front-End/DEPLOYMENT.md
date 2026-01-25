# 배포 설정 가이드

## 🚀 배포 환경 구성

### 현재 배포 구조
- **프론트엔드**: Vercel
- **백엔드**: AWS EC2 (54.66.24.197:8080)
- **프록시**: Vercel의 `vercel.json`을 통해 `/api/*` 요청을 EC2로 프록시

## 📋 설정 파일

### 1. vercel.json
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://54.66.24.197:8080/api/:path*"
    }
  ]
}
```

이 설정으로 Vercel에 배포된 프론트엔드에서 `/api/*` 요청이 자동으로 EC2 서버로 프록시됩니다.

### 2. API 설정 (src/config/api.ts)
```typescript
export const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8080/api'  // 개발 환경
  : '/api';                        // 프로덕션 (Vercel 프록시 사용)
```

## 🔧 환경별 동작

### 개발 환경 (로컬)
- `npm run dev` 실행 시
- API 요청: `http://localhost:8080/api/*`
- 백엔드 서버가 로컬에서 실행되어야 함

### 프로덕션 환경 (Vercel)
- Vercel에 배포된 사이트
- API 요청: `/api/*` (상대 경로)
- Vercel이 자동으로 `vercel.json`의 설정에 따라 EC2로 프록시

## ✅ 확인 사항

### 1. EC2 서버 설정
- EC2 인스턴스가 실행 중인지 확인
- 보안 그룹에서 8080 포트가 열려있는지 확인
- 백엔드 서버가 `0.0.0.0:8080`으로 바인딩되어 있는지 확인 (localhost가 아닌)

### 2. CORS 설정
백엔드 `application.yml` 또는 환경 변수로 Vercel 도메인을 설정합니다:

**방법 1: application.yml 수정**
```yaml
cors:
  allowed-origins: http://localhost:5173,https://your-app.vercel.app
```

**방법 2: 환경 변수 설정 (EC2 서버)**
```bash
export CORS_ALLOWED_ORIGINS="http://localhost:5173,https://your-app.vercel.app"
```

여러 도메인은 쉼표로 구분합니다.

### 3. Vercel 환경 변수
필요한 경우 Vercel 대시보드에서 환경 변수 설정:
- Settings → Environment Variables

## 🐛 문제 해결

### 문제: CORS 오류
**해결**: 백엔드 `SecurityConfig.java`에 Vercel 도메인 추가

### 문제: 502 Bad Gateway
**해결**: 
1. EC2 서버가 실행 중인지 확인
2. EC2 보안 그룹에서 8080 포트 허용 확인
3. `vercel.json`의 destination URL 확인

### 문제: 네트워크 오류
**해결**: 
1. 브라우저 개발자 도구 → Network 탭에서 실제 요청 URL 확인
2. `/api/*` 요청이 올바르게 프록시되는지 확인

## 📝 배포 체크리스트

- [ ] `vercel.json`에 EC2 IP 주소가 올바르게 설정되어 있는지 확인
- [ ] 백엔드 CORS 설정에 Vercel 도메인이 포함되어 있는지 확인
- [ ] EC2 서버가 실행 중이고 8080 포트가 열려있는지 확인
- [ ] 모든 API 호출이 `src/config/api.ts`의 `API_BASE_URL`을 사용하는지 확인
- [ ] 하드코딩된 `localhost:8080`이 없는지 확인
