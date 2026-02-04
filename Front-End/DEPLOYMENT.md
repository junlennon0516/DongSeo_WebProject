# 배포 설정 가이드

## 🚀 배포 환경 구성

### ⚠️ www.totaldongseo.com 요청 흐름 (매우 중요)

```
브라우저 → DNS → Vercel (프론트)
                → vercel.json rewrite
                  → /api/*     → EC2:8080 (Spring)
                  → /ai-api/*  → EC2:8000 (Python AI-Server)
```

- **도메인이 Vercel로 연결되어 있으면**, 요청은 **먼저 Vercel**로 갑니다.
- **EC2 Nginx는 이 경로에 없습니다.** `/ai-api` 처리는 **Vercel rewrites**가 전부입니다.
- 따라서 `/ai-api` 404·502·연결 오류는 **vercel.json**과 **EC2 8000 포트 개방**을 확인해야 합니다.

### 현재 배포 구조
- **프론트**: Vercel (www.totaldongseo.com DNS → Vercel)
- **백엔드(Spring)**: EC2 **8080** — `/api/*`
- **AI 서버(Python FastAPI)**: EC2 **8000** — `/analyze`, `/chat`
- **프록시**: Vercel `vercel.json`에서 `/api/*` → 8080, `/ai-api/*` → **8000**

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

### 1. vercel.json (최종본 — Vercel이 EC2로 프록시)

**EC2_PUBLIC_IP**는 실제 퍼블릭 IP(예: 54.66.24.197)로 넣습니다.

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://EC2_PUBLIC_IP:8080/api/:path*"
    },
    {
      "source": "/ai-api/:path*",
      "destination": "http://EC2_PUBLIC_IP:8000/:path*"
    }
  ]
}
```

- `/api/*` → Spring(8080)
- `/ai-api/*` → Python AI-Server(8000). 요청 `/ai-api/chat` → EC2에서 `http://EC2:8000/chat` 로 전달됨.
- **수정 후 반드시 Vercel 재배포** (git push 또는 Vercel 대시보드 Redeploy).

**EC2 Nginx**: 도메인이 Vercel로 가므로 **EC2 Nginx에서 /ai-api 설정은 불필요**. FastAPI는 8000 포트로만 떠 있으면 됨.

---

### 2. /ai-api는 Spring이 아니라 Python(8000)

| 경로 | 대상 서버 | 포트 | 설명 |
|------|-----------|------|------|
| `/api/*` | Spring Boot | **8080** | 로그인, 견적, 제품, admin |
| `/ai-api/*` | **Python FastAPI** (AI-Server) | **8000** | `/analyze`, `/chat` |

- **Spring에는 `/chat`, `/analyze` 컨트롤러가 없습니다.**  
  `curl http://localhost:8080/ai-api/chat` → 404 가 나오는 이유.
- **실제 AI 엔드포인트**: Python `main.py` → `POST /chat`, `POST /analyze` (포트 **8000**).

**도메인을 EC2로 직접 연결하는 경우에만** Nginx에서 /ai-api를 8000으로 보냅니다. (현재는 DNS → Vercel이므로 위 vercel.json만 맞으면 됨.)

### 3. 프론트엔드 API 호출
- **API(Spring)**: `fetch(\`${API_BASE_URL}/...\`)` → 프로덕션에서 `/api` → Vercel이 8080으로 프록시.
- **AI**: `fetch('/ai-api/analyze', ...)`, `fetch('/ai-api/chat', ...)` (상대 경로) → Vercel이 8000으로 프록시.  
  → `AIChatTab.tsx`에서 `import.meta.env.DEV ? 'http://localhost:8000' : '/ai-api'` 사용 중이면 그대로 두면 됨.

### 4. API 설정 (src/config/api.ts)
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

**문제**: Vercel은 배포할 때마다 도메인이 달라질 수 있습니다
- 프로덕션: `project-name.vercel.app` (고정)
- 프리뷰: `project-name-git-branch-username.vercel.app` (매번 다름)
- 커스텀 도메인: 사용자가 설정한 도메인

**해결 방법** (백엔드 `SecurityConfig.java`에서 자동 처리):

**옵션 1: 모든 도메인 허용 (권장 - 간단)**
```bash
# EC2 서버에서 환경 변수 비워두기 (또는 설정 안 함)
# 기본값: 모든 도메인 허용 (*)
export CORS_ALLOWED_ORIGINS=""
```
→ Vercel 프리뷰 도메인이 바뀌어도 자동 허용됨

**옵션 2: Vercel 도메인 패턴 허용 (프로덕션 권장)**
```bash
# EC2 서버 환경 변수
export CORS_ALLOWED_ORIGINS="http://localhost:5173,https://*.vercel.app,https://your-custom-domain.com"
```
→ `*.vercel.app` 패턴으로 모든 Vercel 서브도메인 허용

**옵션 3: application.yml 수정**
```yaml
cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:}  # 비워두면 모든 도메인 허용
```

**확인**: 백엔드 로그에서 CORS 설정 확인

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

### 문제: ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR (Vercel)
- **증상**: AI 요청 시 Vercel 에러. `ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR`, syd1::... 등.
- **의미**: **Vercel Edge Router**가 설정된 외부 타겟(EC2)에 **연결하지 못함**. Nginx/FastAPI/Spring 에러가 아님.
- **해결**:
  1. **vercel.json**에 `/ai-api/:path*` → `http://EC2_PUBLIC_IP:8000/:path*` 있는지 확인.
  2. **EC2 보안 그룹**에서 **8000 포트 인바운드** 허용 (Source: Vercel IP 대역 또는 `0.0.0.0/0` 테스트용).
  3. EC2에서 **Python AI-Server가 8000에서 실행 중**인지 확인: `curl http://127.0.0.1:8000/`.
  4. **Vercel 재배포**: vercel.json 수정 후 `git push` 또는 Vercel 대시보드에서 Redeploy.

### 문제: /ai-api/chat → 404 또는 502
- **증상**: AI 채팅 요청 시 404 Not Found 또는 502 Bad Gateway.
- **원인**: `/ai-api/*` 가 Spring(8080)으로 가고 있음. Spring에는 `/chat` 이 없음 → 404. 또는 Vercel이 EC2:8000에 연결 실패 → 502.
- **해결**:
  1. **도메인이 Vercel로 갈 때**: vercel.json에 `/ai-api/:path*` → `http://EC2_IP:8000/:path*` 있는지, EC2 8000 포트 개방·FastAPI 실행 여부 확인.
  2. EC2에서 AI-Server 실행 확인: `curl http://127.0.0.1:8000/` → `{"status":"ok",...}`.
  3. 로컬 경로 확인: `curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"hi"}]}'`.

### 문제: GET /api/admin/companies 403 (Forbidden)
- **원인**: `/api/admin/**` 는 STAFF/ADMIN 로그인 필요. 프록시가 `Authorization` 헤더를 백엔드로 넘기지 않으면 403 발생.
- **적용된 조치**: `GET /api/admin/companies` 는 인증 없이 허용 (회사 목록 드롭다운용). 회사 생성·수정·삭제 등 나머지 admin API는 로그인 필요.
- **Nginx 사용 시** (EC2 앞단에 Nginx가 있으면) 아래처럼 `Authorization` 헤더를 반드시 전달해야 합니다:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;  # JWT 전달 필수
}
```

## 🔓 EC2 포트 최소 개방 (Vercel → EC2 연결용)

**www.totaldongseo.com = DNS → Vercel** 이므로, Vercel이 EC2로 나가는 연결만 있으면 됩니다.

| 포트 | 용도 | 보안 그룹 인바운드 |
|------|------|---------------------|
| **8080** | Spring API (`/api/*`) | 0.0.0.0/0 또는 Vercel IP (권장) |
| **8000** | Python AI-Server (`/ai-api/*`) | 0.0.0.0/0 또는 Vercel IP (권장) |

- **ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR** 나오면 → EC2 보안 그룹에서 **8000** 인바운드 허용 여부를 먼저 확인.
- EC2 내부 확인: `curl http://127.0.0.1:8000/` (AI), `curl http://127.0.0.1:8080/api/estimates/ping` (Spring).

## 📝 배포 체크리스트

- [ ] `vercel.json`에 `/api/:path*` → EC2:8080, **`/ai-api/:path*` → EC2:8000** 둘 다 있는지 확인
- [ ] EC2 보안 그룹: **8080, 8000** 인바운드 허용 (Vercel에서 접근 가능하도록)
- [ ] EC2에서 Spring(8080), **Python AI-Server(8000)** 실행 중인지 확인
- [ ] 백엔드 CORS 설정에 Vercel 도메인 포함 여부 확인
- [ ] API 호출은 `API_BASE_URL` 사용, AI 호출은 프로덕션에서 `/ai-api` 사용
- [ ] vercel.json 수정 후 **Vercel 재배포** (git push 또는 Redeploy)
