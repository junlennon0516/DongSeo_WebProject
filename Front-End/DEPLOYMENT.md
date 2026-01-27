# 배포 설정 가이드

## 🚀 배포 환경 구성

### 현재 배포 구조
- **프론트엔드**: Vercel
- **백엔드**: AWS EC2 (54.66.24.197:8080)
- **프록시**: Vercel의 `vercel.json`을 통해 `/api/*` 요청을 EC2로 프록시

---

## 🚨 배포 후 로그인 실패 + `ERR_CONNECTION_REFUSED`

**증상**: 배포는 됐는데 로그인만 안 됨, Network 탭에 `net::ERR_CONNECTION_REFUSED`

**원인**: 프론트에서 호출하는 API 주소가 배포 환경에 없음 (대표적으로 **localhost** 그대로 사용)

### ✅ 체크리스트 (순서대로)

1. **API URL 확인**
   - `src/config/api.ts`에서 `API_BASE_URL` 사용
   - **절대** `fetch('http://localhost:8080/...')` 같은 하드코딩 금지

2. **환경 변수 사용 (권장)**
   - Vercel: **Settings → Environment Variables**
   - `VITE_API_BASE_URL` 추가
     - **프록시 사용 시**: `https://your-vercel-domain.vercel.app` 기준 상대 경로 → `/api`
     - **백엔드 직접 호출 시**: `https://api.your-domain.com/api` (HTTPS 필수, Mixed Content 방지)
   - `NEXT_PUBLIC_` 아님 → Vite는 **`VITE_`** 접두사만 클라이언트에 노출

3. **localhost 금지**
   - 배포 환경에 `http://localhost:8080` / `127.0.0.1` 있으면 **무조건 실패**
   - Vercel 서버에는 localhost가 없음 → `ERR_CONNECTION_REFUSED`

4. **백엔드 서버 확인**
   - 프론트만 Vercel, 백엔드는 로컬만 떠 있으면 연결 거부
   - `curl https://백엔드주소/api/auth/login` (또는 실제 로그인 URL) 테스트

5. **HTTPS 유지**
   - 프론트 HTTPS면 백엔드도 HTTPS 권장 (Mixed Content 차단 방지)
   - EC2 직접 노출 시 nginx 등에서 SSL 처리

### 🔍 지금 바로 확인하는 방법
1. 배포된 사이트 접속 → **개발자 도구(F12) → Console**
   - `[API_BASE_URL] ...` 로그 확인 → **localhost면 원인 확정**
2. **Network** 탭 → 로그인 시도 → 실패한 요청 클릭
   - **Request URL** 확인 → `localhost` / `127.0.0.1` 이면 프론트 설정 문제
3. 그 URL을 **주소창에 직접 입력** → 안 열리면 서버 미배포/방화벽 등 백엔드 측 이슈

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
- **`VITE_API_BASE_URL`** 이 있으면 해당 값 사용 (Vercel env 권장)
- 없으면:
  - 개발: `http://localhost:8080/api`
  - 프로덕션: `/api` (Vercel rewrites → EC2)

**Vercel에서 프록시만 쓸 때**: `VITE_API_BASE_URL` 비워두면 기본값 `/api` 사용  
**백엔드 직접 URL 쓸 때**: `VITE_API_BASE_URL=https://api.your-domain.com/api` 설정

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
**Settings → Environment Variables** 에서:

| 이름 | 값 | 비고 |
|------|-----|------|
| `VITE_API_BASE_URL` | `/api` | 프록시 사용 시 (기본). 비워둬도 동일 |
| `VITE_API_BASE_URL` | `https://api.your-domain.com/api` | 백엔드 직접 호출 시 (HTTPS 권장) |

- **`VITE_`** 접두사만 클라이언트에서 접근 가능
- 배포 후 변경 시 **Redeploy** 필요

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
